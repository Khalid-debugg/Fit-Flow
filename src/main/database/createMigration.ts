import { writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

/**
 * Helper script to create a new migration file
 * Usage: npm run db:create-migration <migration_name>
 */

function createMigration(name: string): void {
  if (!name) {
    console.error('Error: Migration name is required')
    console.log('Usage: npm run db:create-migration <migration_name>')
    process.exit(1)
  }

  // Get the next migration number
  const migrationsPath = join(__dirname, 'migrations')
  const existingMigrations = readdirSync(migrationsPath)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  let nextNumber = 1
  if (existingMigrations.length > 0) {
    const lastMigration = existingMigrations[existingMigrations.length - 1]
    const lastNumber = parseInt(lastMigration.split('_')[0], 10)
    nextNumber = lastNumber + 1
  }

  // Format the number with leading zeros (e.g., 001, 002, etc.)
  const formattedNumber = nextNumber.toString().padStart(3, '0')

  // Format the migration name (replace spaces with underscores, lowercase)
  const formattedName = name.toLowerCase().replace(/\s+/g, '_')

  // Create the migration filename
  const filename = `${formattedNumber}_${formattedName}.sql`
  const filePath = join(migrationsPath, filename)

  // Create the migration template
  const template = `-- UP
-- Write your migration SQL here
-- Example:
-- ALTER TABLE members ADD COLUMN profile_image TEXT;

-- DOWN
-- Write the rollback SQL here
-- Example:
-- ALTER TABLE members DROP COLUMN profile_image;
`

  // Write the migration file
  writeFileSync(filePath, template, 'utf-8')

  console.log(`✓ Created migration: ${filename}`)
  console.log(`  Path: ${filePath}`)
  console.log('\nNext steps:')
  console.log('1. Edit the migration file and add your SQL')
  console.log('2. Run the application to apply the migration')
}

// Get the migration name from command line arguments
const migrationName = process.argv[2]
createMigration(migrationName)
