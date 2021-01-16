# Technical Writeup

Here is a writeup on some considerations while designing the app.

## Challenge

The main challenge is to make it hard for people to fake their attendance.

Some ways they can cheat the system:
1. Sharing the link.
2. Sharing "unique" code.

### Background conditions

Some background conditions that influence our application design:
1. We have a full list of club members, so there is no need for sign-ups before every event.
2. The number of attendees per week are fluctuating.
3. We want to make it hard for people to fake their attendance in the system.
4. We want the app flow to be as simple as possible.
### Other alternatives that we consider

1. Telegram bot: Requires an always-on server which costs us some money on a monthly basis.

## App Design (Security)

Several precautions applied in the design of the app

1. Add a unique code for each event, auto updated via cron trigger.
2. The unique code is appended on the link shown via the QR code. The page that shows QR code is password-protected. We intentionally do not share the link **in text** to prevent link sharing. Read [login flow](#login-flow) on how the app prevent unique code sharing.
3. Disable form submission on non event days.
4. Password protected admin page and qr listing page.

## App flow

### Login flow

1. QR page shows link to form with special token in path.
2. On page visit, the token from path will be stored in cookie (key = `code`), and the browser history is replaced. This is to prevent users from getting the code from their browser history.
3. Upon receiving form submission, the API will:
   1. Check whether the time of the event is valid.
   2. Check whether the code (from cookie) is valid.
4. If so, the API will record attendance and return success page, with a request to invalidate the previous code. Otherwise, it will show an error message / return the form.
