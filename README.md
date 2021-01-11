# QR Attendance System

QR code based attendance system, similar to Singapore's Safe Entry

# User Guide

## Routes:

1. QR: https://angklung.benclmnt.com/qr
2. Admin: https://angklung.benclmnt.com/list
3. Form: https://angklung.benclmnt.com

## Usage

1. Just show qr page, the qr will redirect to the attendance form
2. For admin page, enter password. You can export the data to excel file by clicking export on top

# Developer Guide

## Security

Several precautions applied in the design of the app

1. Add a unique code for each event, auto updated via cron trigger.
2. Disable form submission on non event days
3. Password protected admin page

## App flow

### Login flow

1. QR page shows link to form with special token in path
2. On visit, the token from path will be stored in cookie (key = `code`), and the browser history is replaced
3. Upon receiving the post request to record attendance, the API will:
   1. Check whether the time of the event matches
   2. Check whether the code (from cookie) is valid
4. If so, the API will record attendance and return success page, with a request to invalidate the previous code

## Stack

Cloudflare workers + Cloudflare KV
