# Java Fingerprint Bridge

This service is the safe layer between the HID DigitalPersona SDK and your MERN backend.

## Endpoints

- `GET /health`
- `POST /enroll` with body `{"cnic":"12345-1234567-1"}`
- `POST /identify`

## Why Java here

You already have the Java SDK jars and sample code. This lets you:

- reuse the SDK immediately
- isolate device logic from MERN
- keep browser/device boundaries clean

