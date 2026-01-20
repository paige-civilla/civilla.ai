/**
 * Fix missing database columns for Lexi functionality
 */
import { Pool } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.replace(/\\n/g, '').replace(/\n/g, '').trim();
  
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  
  // Clean the URL - remove any leading garbage
  const cleanUrl = databaseUrl.replace(/^[^p]*postgresql/, 'postgresql');
  console.log('Connecting to database...');
  
  const pool = new Pool({ connectionString: cleanUrl });
  
  try {
    // Check if lexi_user_prefs exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'lexi_user_prefs'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating lexi_user_prefs table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lexi_user_prefs (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL UNIQUE,
          response_style TEXT NOT NULL DEFAULT 'bullets',
          verbosity INTEGER NOT NULL DEFAULT 3,
          citation_strictness TEXT NOT NULL DEFAULT 'when_available',
          default_mode TEXT NOT NULL DEFAULT 'organize',
          streaming_enabled BOOLEAN NOT NULL DEFAULT true,
          faster_mode BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✓ Created lexi_user_prefs table');
    } else {
      // Check for streaming_enabled column
      const colCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'lexi_user_prefs' AND column_name = 'streaming_enabled'
        );
      `);
      
      if (!colCheck.rows[0].exists) {
        console.log('Adding streaming_enabled column...');
        await pool.query(`
          ALTER TABLE lexi_user_prefs 
          ADD COLUMN IF NOT EXISTS streaming_enabled BOOLEAN NOT NULL DEFAULT true;
        `);
        console.log('✓ Added streaming_enabled column');
      } else {
        console.log('✓ streaming_enabled column already exists');
      }
      
      // Check for faster_mode column
      const fasterCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'lexi_user_prefs' AND column_name = 'faster_mode'
        );
      `);
      
      if (!fasterCheck.rows[0].exists) {
        console.log('Adding faster_mode column...');
        await pool.query(`
          ALTER TABLE lexi_user_prefs 
          ADD COLUMN IF NOT EXISTS faster_mode BOOLEAN NOT NULL DEFAULT false;
        `);
        console.log('✓ Added faster_mode column');
      } else {
        console.log('✓ faster_mode column already exists');
      }
    }
    
    // Check for activity_logs module_key column
    const activityCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'activity_logs'
      );
    `);
    
    if (activityCheck.rows[0].exists) {
      const moduleKeyCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'activity_logs' AND column_name = 'module_key'
        );
      `);
      
      if (!moduleKeyCheck.rows[0].exists) {
        console.log('Adding module_key column to activity_logs...');
        await pool.query(`
          ALTER TABLE activity_logs 
          ADD COLUMN IF NOT EXISTS module_key TEXT;
        `);
        console.log('✓ Added module_key column');
      } else {
        console.log('✓ module_key column already exists');
      }
    }
    
    console.log('\n✅ Database columns fixed successfully!');
  } catch (err) {
    console.error('Error fixing columns:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
