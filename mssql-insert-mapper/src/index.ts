import type { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import type * as sqlNS from 'mssql';
import * as sql from 'mssql';

// Helper: validate and quote identifiers (schema/table/column)
function sanitizeAndBracketIdentifier(input: string): string {
	// allow dotted identifiers like dbo.Table or MySchema.My.Table (we'll bracket each part)
	const parts = input.split('.');
	const isValid = parts.every((p) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(p));
	if (!isValid) {
		throw new Error(`Invalid identifier: ${input}. Only letters, numbers, and underscores are allowed, and it must not start with a number.`);
	}
	return parts.map((p) => `[${p}]`).join('.');
}

// Map config string to mssql type
function resolveSqlType(t: string, length?: number, precision?: number, scale?: number): sqlNS.ISqlType {
	switch (t) {
		case 'varchar': return length ? (sql.VarChar(length)) : sql.VarChar;
		case 'nvarchar': return length ? (sql.NVarChar(length)) : sql.NVarChar;
		case 'int': return sql.Int;
		case 'bigint': return sql.BigInt;
		case 'float': return sql.Float;
		case 'decimal': return (precision && scale) ? sql.Decimal(precision, scale) : sql.Decimal(18, 2);
		case 'bit': return sql.Bit;
		case 'date': return sql.Date;
		case 'datetime2': return sql.DateTime2;
		case 'uniqueidentifier': return sql.UniqueIdentifier;
		default:
			throw new Error(`Unsupported SQL type: ${t}`);
	}
}

export class MsSqlInsertMapper implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MSSQL Insert (Mapper)',
		name: 'msSqlInsertMapper',
		icon: 'file:sql.svg',
		group: ['transform'],
		version: 1,
		description: 'Insert rows into SQL Server with user-defined column mappings',
		defaults: {
			name: 'MSSQL Insert (Mapper)',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'microsoftSql',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Table',
				name: 'table',
				type: 'string',
				default: '',
				placeholder: 'dbo.MyTable',
				required: true,
				description: 'Target table (optionally schema-qualified, e.g. dbo.MyTable)',
			},
			{
				displayName: 'Columns',
				name: 'columns',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						name: 'column',
						displayName: 'Column',
						values: [
							{
								displayName: 'Column Name',
								name: 'columnName',
								type: 'string',
								default: '',
								placeholder: 'FirstName',
								required: true,
							},
							{
								displayName: 'SQL Type',
								name: 'dataType',
								type: 'options',
								default: 'nvarchar',
								options: [
									{ name: 'NVARCHAR', value: 'nvarchar' },
									{ name: 'VARCHAR', value: 'varchar' },
									{ name: 'INT', value: 'int' },
									{ name: 'BIGINT', value: 'bigint' },
									{ name: 'FLOAT', value: 'float' },
									{ name: 'DECIMAL', value: 'decimal' },
									{ name: 'BIT', value: 'bit' },
									{ name: 'DATE', value: 'date' },
									{ name: 'DATETIME2', value: 'datetime2' },
									{ name: 'UNIQUEIDENTIFIER', value: 'uniqueidentifier' },
								],
							},
							{
								displayName: 'Length',
								name: 'length',
								type: 'number',
								default: 255,
								description: 'For (N)VARCHAR',
								displayOptions: {
									show: {
										dataType: ['varchar', 'nvarchar'],
									},
								},
							},
							{
								displayName: 'Precision',
								name: 'precision',
								type: 'number',
								default: 18,
								description: 'For DECIMAL',
								displayOptions: {
									show: {
										dataType: ['decimal'],
									},
								},
							},
							{
								displayName: 'Scale',
								name: 'scale',
								type: 'number',
								default: 2,
								description: 'For DECIMAL',
								displayOptions: {
									show: {
										dataType: ['decimal'],
									},
								},
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '={{$json.field}}',
								typeOptions: {
									allowExpressions: true,
								},
								description: 'Use expressions to pull from input data, e.g. {{$json.firstName}}',
							},
						],
					},
				],
			},
			{
				displayName: 'Advanced',
				name: 'advanced',
				type: 'collection',
				placeholder: 'Options',
				default: {},
				options: [
					{
						displayName: 'Use Transaction',
						name: 'useTx',
						type: 'boolean',
						default: false,
						description: 'Wrap all inserts in a transaction',
					},
					{
						displayName: 'Trust Server Certificate',
						name: 'trustServerCertificate',
						type: 'boolean',
						default: true,
						description: 'Set to true for dev/self-signed servers (overrides credential if specified)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		// Get params (table & mappings are shared, but mapping values evaluate per-item)
		const tableRaw = this.getNodeParameter('table', 0) as string;
		const table = sanitizeAndBracketIdentifier(tableRaw);

		const columnsParam = this.getNodeParameter('columns', 0, {}) as {
			column?: Array<{
				columnName: string;
				dataType: string;
				length?: number;
				precision?: number;
				scale?: number;
				value: unknown;
			}>;
		};

		const columnDefs = columnsParam.column ?? [];
		if (columnDefs.length === 0) {
			throw new NodeApiError(this.getNode(), new Error('Please configure at least one column mapping.'));
		}

		// Build the static parts of the INSERT statement (identifiers only)
		const columnNamesSql = columnDefs.map((c) => sanitizeAndBracketIdentifier(c.columnName)).join(', ');
		const paramNames = columnDefs.map((_, idx) => `@p${idx}`);
		const insertSql = `INSERT INTO ${table} (${columnNamesSql}) VALUES (${paramNames.join(', ')});`;

		// Credentials
		const creds = await this.getCredentials('microsoftSql') as {
			user: string;
			password: string;
			server: string;
			database: string;
			port?: number;
			domain?: string;
			encrypt?: boolean;
			trustServerCertificate?: boolean;
		};

		// Advanced toggles
		const useTx = this.getNodeParameter('advanced.useTx', 0, false) as boolean;
		const trustServerCertificateOverride = this.getNodeParameter('advanced.trustServerCertificate', 0, undefined) as boolean | undefined;

		const cfg: sqlNS.config = {
			user: creds.user,
			password: creds.password,
			server: creds.server,
			database: creds.database,
			port: creds.port,
			domain: creds.domain,
			options: {
				encrypt: creds.encrypt ?? true,
				trustServerCertificate: trustServerCertificateOverride ?? creds.trustServerCertificate ?? false,
			},
			pool: {
				max: 10,
				min: 0,
				idleTimeoutMillis: 30000,
			},
		};

		let pool: sqlNS.ConnectionPool | undefined;
		let transaction: sqlNS.Transaction | undefined;

		try {
			pool = await new sql.ConnectionPool(cfg).connect();

			if (useTx) {
				transaction = new sql.Transaction(pool);
				await transaction.begin();
			}

			const results: INodeExecutionData[] = [];

			for (let i = 0; i < items.length; i++) {
				// Build a request per item (values differ)
				const request = new sql.Request(transaction ?? pool);

				// Bind parameters using user-defined types (values can be expressions and will be evaluated here)
				columnDefs.forEach((c, idx) => {
					const value = this.getNodeParameter(`columns.column.${idx}.value`, i) as unknown;
					const sqlType = resolveSqlType(c.dataType, c.length, c.precision, c.scale);
					request.input(`p${idx}`, sqlType as any, value as any);
				});

				const execResult = await request.query(insertSql);

				results.push({
					json: {
						...items[i].json,
						_mssql: {
							rowsAffected: execResult.rowsAffected?.[0] ?? 0,
						},
					},
					binary: items[i].binary,
				});
			}

			if (useTx && transaction) {
				await transaction.commit();
			}

			return [results];
		} catch (error) {
			if (useTx && transaction) {
				try { await transaction.rollback(); } catch { }
			}
			throw new NodeApiError(this.getNode(), error as Error);
		} finally {
			try { await pool?.close(); } catch { }
		}
	}
}