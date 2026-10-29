-- Extend product listings and store locations without changing order settlement.
alter table public.products
  add column if not exists description text not null default '',
  add column if not exists image_url text,
  add column if not exists availability_note text not null default '';
alter table public.stores
  add column if not exists address text not null default '',
  add column if not exists city text not null default '',
  add column if not exists is_accepting_orders boolean not null default true;
alter table public.products
  add constraint products_description_length_check check (char_length(description) <= 2000) not valid;
alter table public.products validate constraint products_description_length_check;
alter table public.products
  add constraint products_image_url_length_check check (image_url is null or char_length(image_url) <= 2048) not valid;
alter table public.products validate constraint products_image_url_length_check;
alter table public.products
  add constraint products_availability_note_length_check check (char_length(availability_note) <= 300) not valid;
alter table public.products validate constraint products_availability_note_length_check;
alter table public.stores
  add constraint stores_address_length_check check (char_length(address) <= 500) not valid;
alter table public.stores validate constraint stores_address_length_check;
alter table public.stores
  add constraint stores_city_length_check check (char_length(city) <= 120) not valid;
alter table public.stores validate constraint stores_city_length_check;
