/**
 * Migration Script: Supabase Storage -> Cloudinary
 *
 * This script:
 * 1. Reads database rows with Supabase Storage image URLs (profiles, photos, albums, teachers).
 * 2. Downloads each image and uploads it to Cloudinary with compression & optimization.
 * 3. Updates the Supabase database rows with the new Cloudinary URLs.
 * 4. Can optionally delete the migrated files from Supabase Storage (--delete-supabase-files).
 *
 * Usage:
 *   node scripts/migrate-to-cloudinary.js
 *   node scripts/migrate-to-cloudinary.js --delete-supabase-files
 */

const { createClient } = require('@supabase/supabase-js');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Load .env.local if present
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const deleteSupabaseFiles = process.argv.includes('--delete-supabase-files');

async function main() {
  console.log('--- Supabase to Cloudinary Image Migration ---');

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('❌ Cloudinary credentials missing in .env.local!');
    console.error('Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing in .env.local!');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Migrate Profiles
  console.log('\n🔍 Checking profiles...');
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .not('avatar_url', 'is', null);

  if (profErr) console.error('Error fetching profiles:', profErr.message);
  else {
    for (const p of profiles || []) {
      if (p.avatar_url && p.avatar_url.includes('supabase.co')) {
        console.log(`Migrating avatar for profile ${p.full_name || p.id}...`);
        try {
          const res = await cloudinary.uploader.upload(p.avatar_url, {
            folder: `alumni-hub/avatars/${p.id}`,
            resource_type: 'image',
          });
          await supabase.from('profiles').update({ avatar_url: res.secure_url }).eq('id', p.id);
          console.log(`  ✅ Migrated: ${res.secure_url}`);
        } catch (e) {
          console.error(`  ❌ Failed for profile ${p.id}:`, e.message);
        }
      }
    }
  }

  // 2. Migrate Photos
  console.log('\n🔍 Checking photos...');
  const { data: photos, error: photoErr } = await supabase
    .from('photos')
    .select('id, album_id, url')
    .not('url', 'is', null);

  if (photoErr) console.error('Error fetching photos:', photoErr.message);
  else {
    for (const ph of photos || []) {
      if (ph.url && ph.url.includes('supabase.co')) {
        console.log(`Migrating photo ${ph.id}...`);
        try {
          const res = await cloudinary.uploader.upload(ph.url, {
            folder: `alumni-hub/gallery/${ph.album_id}`,
            resource_type: 'image',
          });
          await supabase.from('photos').update({ url: res.secure_url }).eq('id', ph.id);
          console.log(`  ✅ Migrated: ${res.secure_url}`);
        } catch (e) {
          console.error(`  ❌ Failed for photo ${ph.id}:`, e.message);
        }
      }
    }
  }

  // 3. Migrate Albums cover_url
  console.log('\n🔍 Checking album covers...');
  const { data: albums, error: albErr } = await supabase
    .from('albums')
    .select('id, title, cover_url')
    .not('cover_url', 'is', null);

  if (albErr) console.error('Error fetching albums:', albErr.message);
  else {
    for (const alb of albums || []) {
      if (alb.cover_url && alb.cover_url.includes('supabase.co')) {
        console.log(`Migrating cover for album ${alb.title}...`);
        try {
          const res = await cloudinary.uploader.upload(alb.cover_url, {
            folder: `alumni-hub/gallery/${alb.id}`,
            resource_type: 'image',
          });
          await supabase.from('albums').update({ cover_url: res.secure_url }).eq('id', alb.id);
          console.log(`  ✅ Migrated: ${res.secure_url}`);
        } catch (e) {
          console.error(`  ❌ Failed for album ${alb.id}:`, e.message);
        }
      }
    }
  }

  // 4. Migrate Teachers
  console.log('\n🔍 Checking teachers...');
  const { data: teachers, error: teachErr } = await supabase
    .from('teachers')
    .select('id, full_name, avatar_url')
    .not('avatar_url', 'is', null);

  if (teachErr) console.error('Error fetching teachers:', teachErr.message);
  else {
    for (const t of teachers || []) {
      if (t.avatar_url && t.avatar_url.includes('supabase.co')) {
        console.log(`Migrating avatar for teacher ${t.full_name}...`);
        try {
          const res = await cloudinary.uploader.upload(t.avatar_url, {
            folder: 'alumni-hub/teachers',
            resource_type: 'image',
          });
          await supabase.from('teachers').update({ avatar_url: res.secure_url }).eq('id', t.id);
          console.log(`  ✅ Migrated: ${res.secure_url}`);
        } catch (e) {
          console.error(`  ❌ Failed for teacher ${t.id}:`, e.message);
        }
      }
    }
  }

  // 5. Optional cleanup of Supabase Storage files
  if (deleteSupabaseFiles) {
    console.log('\n🧹 Cleaning up Supabase Storage buckets to free space...');
    for (const bucket of ['avatars', 'gallery']) {
      try {
        const { data: files } = await supabase.storage.from(bucket).list();
        if (files && files.length > 0) {
          console.log(`Bucket ${bucket}: found ${files.length} items to check.`);
          // Recursively list or delete
          for (const item of files) {
            if (item.id) {
              await supabase.storage.from(bucket).remove([item.name]);
            } else {
              // folder: list folder items
              const { data: subFiles } = await supabase.storage.from(bucket).list(item.name);
              if (subFiles && subFiles.length > 0) {
                const paths = subFiles.map((sf) => `${item.name}/${sf.name}`);
                await supabase.storage.from(bucket).remove(paths);
                console.log(`  Deleted ${paths.length} files from ${bucket}/${item.name}`);
              }
            }
          }
        }
      } catch (cleanErr) {
        console.error(`Could not clean bucket ${bucket}:`, cleanErr.message);
      }
    }
  } else {
    console.log('\n💡 Note: Supabase Storage files were kept as a backup.');
    console.log('To delete them from Supabase Storage and reclaim space, run:');
    console.log('  node scripts/migrate-to-cloudinary.js --delete-supabase-files');
  }

  console.log('\n✨ Migration script completed successfully!');
}

main().catch(console.error);
