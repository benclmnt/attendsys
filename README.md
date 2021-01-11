# QR Attendance System

QR code based attendance system, similar to Singapore's Safe Entry

## Routes:

1. QR: https://angklung.benclmnt.com/qr
2. Admin: https://angklung.benclmnt.com/list
3. Form: https://angklung.benclmnt.com

## Usage

1. Just show qr page, the qr will redirect to homepage
2. For admin page, enter password. You can export the data to excel file by clicking export on top

## Security

Several precautions applied in the design of the app

1. Add a unique code for each event, auto updated via cron trigger.
2. Disable form submission on non event days
3. Password protected admin page

## Stack

Cloudflare workers + Cloudflare KV
