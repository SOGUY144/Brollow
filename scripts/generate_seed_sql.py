import json
import re

with open('public/images/items/credits.json', 'r', encoding='utf-8') as f:
    credits_map = json.load(f)

demo_users = {
    'u-demo': ('00000000-0000-0000-0000-000000000001', 'Alex Morgan', 'Hackney, London', 'Demo account', '2025-03-02'),
    'u-priya': ('00000000-0000-0000-0000-000000000002', 'Priya S.', 'Islington, London', 'Photographer and weekend DIYer.', '2024-11-18'),
    'u-tom': ('00000000-0000-0000-0000-000000000003', 'Tom H.', 'Didsbury, Manchester', 'Family camper with a garage full of kit.', '2024-08-09'),
    'u-hannah': ('00000000-0000-0000-0000-000000000004', 'Hannah K.', 'Clifton, Bristol', 'Cyclist and video maker.', '2025-01-27'),
    'u-sam': ('00000000-0000-0000-0000-000000000005', 'Sam O.', 'Headingley, Leeds', 'Guitar teacher who lends spare gear.', '2024-06-14'),
    'u-fiona': ('00000000-0000-0000-0000-000000000006', 'Fiona M.', 'Leith, Edinburgh', 'Hill walker and golfer.', '2025-02-11'),
    'u-marcus': ('00000000-0000-0000-0000-000000000007', 'Marcus B.', 'Kemptown, Brighton', 'Sea swimmer, paddler and part-time DJ.', '2024-09-30'),
    'u-leah': ('00000000-0000-0000-0000-000000000008', 'Leah W.', 'Jewellery Quarter, Birmingham', 'Runs small community events.', '2025-04-05'),
    'u-callum': ('00000000-0000-0000-0000-000000000009', 'Callum R.', 'Finnieston, Glasgow', 'Gamer and festival goer.', '2024-12-03'),
}

with open('lib/data/seed.ts', 'r', encoding='utf-8') as f:
    text = f.read()

items_block = text[text.find('const ITEMS: SeedItem[] = ['):text.find('export const SEED_CREATED_AT')]

# Simple parser for the items
item_pattern = re.compile(
    r'\[\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(\d+),\s*"([^"]+)",\s*"([^"]+)",\s*\n?\s*"([^"]+)",\s*\n?\s*\[(.*?)\]\s*\]',
    re.DOTALL
)

sql_lines = [
    "-- Seed data for Brollow items and demo profiles",
    "-- Allows demo profiles without strict auth.users foreign key constraint",
    "alter table public.profiles drop constraint if exists profiles_id_fkey;",
    "",
    "-- Insert demo profiles",
]

for uid, (uuid_val, name, area, bio, member_since) in demo_users.items():
    sql_lines.append(
        f"insert into public.profiles (id, display_name, area, bio, member_since, is_demo) "
        f"values ('{uuid_val}', '{name}', '{area}', '{bio}', '{member_since}', true) "
        f"on conflict (id) do update set display_name = excluded.display_name;"
    )

sql_lines.append("")
sql_lines.append("-- Insert seed items")

matches = item_pattern.findall(items_block)
print(f"Matched {len(matches)} items")

for match in matches:
    item_id, owner_key, title, category, baht, location, condition, desc, raw_rules = match
    owner_uuid = demo_users[owner_key][0]
    daily_price = int(baht) * 100
    
    # parse rules
    rules = [r.strip().strip('"') for r in raw_rules.split(',') if r.strip()]
    def esc(s):
        return s.replace("'", "''")

    rules_list = [f"'{esc(r)}'" for r in rules]
    rules_pg = f"ARRAY[{', '.join(rules_list)}]" if rules_list else "'{}'::text[]"
    
    # images
    num_images = len(credits_map.get(item_id, []))
    images = [f"/images/items/{item_id}-{n+1}.jpg" for n in range(num_images)]
    images_list = [f"'{img}'" for img in images]
    images_pg = f"ARRAY[{', '.join(images_list)}]" if images_list else "'{}'::text[]"
    
    desc_escaped = desc.replace("'", "''")
    title_escaped = title.replace("'", "''")
    location_escaped = location.replace("'", "''")
    
    sql_lines.append(
        f"insert into public.items (owner_id, title, description, category, daily_price_satang, location, condition, rules, images, status) "
        f"values ('{owner_uuid}', '{title_escaped}', '{desc_escaped}', '{category}', {daily_price}, '{location_escaped}', '{condition}', {rules_pg}, {images_pg}, 'active');"
    )

with open('supabase/seed.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_lines))

print("Wrote supabase/seed.sql successfully!")
