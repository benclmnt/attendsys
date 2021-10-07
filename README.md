# QR Attendance System

QR code based attendance system, similar to Singapore's Safe Entry

## What is this app build for?

This app is build for attendance tracking for a school club's weekly activities.

## User Guide

Important Routes:

1. QR: `/qr`
2. Admin: `/list`

### Usage

#### Attendance taking

1. Admin log into QR route (`/qr`) to get the QR code that will be shown on the page
2. Attendees can then scan the QR code and input their particulars.
3. Upon successful submission, they would get a confirmation page with green background. Otherwise, it will just keep refreshing the form.

![attend-flow](https://user-images.githubusercontent.com/49342399/136303741-130ac475-8491-4b74-b3f2-4505082ad905.png)

#### Attendance listing

1. Admin log into admin route (`/list`) and a table of attendance will be shown.
2. Admin can export the data to excel file by clicking the export button on top of the page.

![attend-list](https://user-images.githubusercontent.com/49342399/136303916-b5074b4a-c21f-4b10-b974-20f273a82cd4.png)

## Developer Guide

Read [technical guide](TECHNICAL.md) for app design.

### Local Development

1. Copy `example.wrangler.toml` into `wrangler.toml` and fill in `account_id`, `ADMIN_PSWD` and KV namespaces id(s).
2. `yarn` to install dependencies
3. `yarn start`
4. Open `http://localhost:8787` to see your app running.

## Stack

The app is hosted on Cloudflare Workers, with data stored on Cloudflare KV.
