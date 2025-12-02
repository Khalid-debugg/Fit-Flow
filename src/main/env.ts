import { config } from 'dotenv'
import { join } from 'path'

// Load environment variables BEFORE anything else
// This file should be imported first in index.ts
config({ path: join(__dirname, '../../.env') })

export {}
