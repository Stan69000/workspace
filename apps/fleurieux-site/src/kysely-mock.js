export const DEFAULT_MIGRATION_TABLE = '__kysely_migration__'
export const DEFAULT_MIGRATION_LOCK_TABLE = '__kysely_migration_lock__'
export const DefaultQueryCompiler = class {}
export const SqliteAdapter = class {}
export const SqliteQueryCompiler = class {}
export const FileMigrationProvider = class {}
export const Migrator = class {}
export const Kysely = class {}
export const SqliteDialect = class {}
export const PostgresDialect = class {}
export const MysqlDialect = class {}
export const MssqlDialect = class {}
export const CamelCasePlugin = class {}
export const DeduplicateJoinsPlugin = class {}
export const ParseJSONResultsPlugin = class {}
export const WithSchemaPlugin = class {}
export const DummyDriver = class {}
export const CompiledQuery = { raw: () => ({}) }
export const sql = () => ({ execute: async () => ({}) })
export default {}
