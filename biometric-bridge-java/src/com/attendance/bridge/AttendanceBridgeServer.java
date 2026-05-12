package com.attendance.bridge;

import com.digitalpersona.onetouch.DPFPDataPurpose;
import com.digitalpersona.onetouch.DPFPFeatureSet;
import com.digitalpersona.onetouch.DPFPGlobal;
import com.digitalpersona.onetouch.DPFPSample;
import com.digitalpersona.onetouch.DPFPTemplate;
import com.digitalpersona.onetouch.capture.DPFPCapture;
import com.digitalpersona.onetouch.processing.DPFPEnrollment;
import com.digitalpersona.onetouch.processing.DPFPFeatureExtraction;
import com.digitalpersona.onetouch.readers.DPFPReaderDescription;
import com.digitalpersona.onetouch.readers.DPFPReadersCollection;
import com.digitalpersona.onetouch.verification.DPFPVerification;
import com.digitalpersona.onetouch.verification.DPFPVerificationResult;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.LinkedBlockingQueue;

public class AttendanceBridgeServer {
    private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("BRIDGE_PORT", "8080"));
    private static String selectedReaderSerial = null;
    private static String lastReaderError = "";
    private static int lastReaderCount = 0;

    public static void main(String[] args) throws Exception {
        initializeReader();

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/health", new HealthHandler());
        server.createContext("/enroll", new EnrollHandler());
        server.createContext("/identify", new IdentifyHandler());
        server.setExecutor(null);
        server.start();

        System.out.println("Fingerprint bridge listening on http://127.0.0.1:" + PORT);
    }

    private static void initializeReader() {
        try {
            DPFPReadersCollection readers = DPFPGlobal.getReadersFactory().getReaders();
            lastReaderCount = readers == null ? 0 : readers.size();

            if (readers != null && readers.size() > 0) {
                DPFPReaderDescription reader = readers.get(0);
                selectedReaderSerial = reader.getSerialNumber();
                lastReaderError = "";
                System.out.println("Detected fingerprint readers: " + readers.size());
                System.out.println("Using reader serial: " + selectedReaderSerial);
            } else {
                selectedReaderSerial = null;
                lastReaderError = "SDK returned zero readers";
                System.out.println("Fingerprint SDK returned zero readers");
            }
        } catch (Exception error) {
            selectedReaderSerial = null;
            lastReaderCount = 0;
            lastReaderError = error.getClass().getSimpleName() + ": " + error.getMessage();
            System.out.println("Fingerprint reader initialization failed: " + lastReaderError);
        }
    }

    private static DPFPSample captureSample(String prompt) throws Exception {
        if (selectedReaderSerial == null) {
            initializeReader();
        }

        if (selectedReaderSerial == null) {
            throw new IllegalStateException("No fingerprint reader found");
        }

        System.out.println(prompt);

        LinkedBlockingQueue<DPFPSample> queue = new LinkedBlockingQueue<>();
        DPFPCapture capture = DPFPGlobal.getCaptureFactory().createCapture();
        capture.setReaderSerialNumber(selectedReaderSerial);
        capture.addDataListener(event -> {
            if (event.getSample() != null) {
                try {
                    queue.put(event.getSample());
                } catch (InterruptedException ignored) {
                }
            }
        });

        capture.startCapture();
        DPFPSample sample = queue.take();
        capture.stopCapture();
        return sample;
    }

    private static void sendJson(HttpExchange exchange, int statusCode, String body) throws IOException {
        Headers headers = exchange.getResponseHeaders();
        headers.add("Content-Type", "application/json; charset=utf-8");
        headers.add("Access-Control-Allow-Origin", "*");

        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);

        try (OutputStream outputStream = exchange.getResponseBody()) {
            outputStream.write(bytes);
        }
    }

    private abstract static class JsonHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
                exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
                exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                handleJson(exchange);
            } catch (Exception error) {
                sendJson(exchange, 500, JsonUtils.object(
                        JsonUtils.stringField("status", "error"),
                        JsonUtils.stringField("message", error.getMessage())
                ));
            }
        }

        protected abstract void handleJson(HttpExchange exchange) throws Exception;
    }

    private static class HealthHandler extends JsonHandler {
        @Override
        protected void handleJson(HttpExchange exchange) throws Exception {
            initializeReader();

            if (selectedReaderSerial == null) {
                sendJson(exchange, 503, JsonUtils.object(
                        JsonUtils.stringField("status", "error"),
                        JsonUtils.stringField("message", "fingerprint reader not detected"),
                        JsonUtils.numberField("readerCount", lastReaderCount),
                        JsonUtils.stringField("sdkDetail", lastReaderError)
                ));
                return;
            }

            sendJson(exchange, 200, JsonUtils.object(
                    JsonUtils.stringField("status", "ok"),
                    JsonUtils.stringField("message", "fingerprint reader detected"),
                    JsonUtils.stringField("readerSerial", selectedReaderSerial),
                    JsonUtils.numberField("readerCount", lastReaderCount)
            ));
        }
    }

    private static class EnrollHandler extends JsonHandler {
        @Override
        protected void handleJson(HttpExchange exchange) throws Exception {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, JsonUtils.object(
                        JsonUtils.stringField("status", "error"),
                        JsonUtils.stringField("message", "POST required")
                ));
                return;
            }

            String body = JsonUtils.readBody(exchange.getRequestBody().readAllBytes());
            String cnic = JsonUtils.getJsonString(body, "cnic");

            if (cnic.isEmpty()) {
                sendJson(exchange, 400, JsonUtils.object(
                        JsonUtils.stringField("status", "error"),
                        JsonUtils.stringField("message", "cnic is required")
                ));
                return;
            }

            if (!DatabaseHelper.employeeExistsByCnic(cnic)) {
                sendJson(exchange, 404, JsonUtils.object(
                        JsonUtils.stringField("status", "error"),
                        JsonUtils.stringField("message", "employee not found for provided cnic")
                ));
                return;
            }

            DPFPFeatureExtraction extraction = DPFPGlobal.getFeatureExtractionFactory().createFeatureExtraction();
            DPFPEnrollment enrollment = DPFPGlobal.getEnrollmentFactory().createEnrollment();

            while (enrollment.getFeaturesNeeded() > 0) {
                DPFPSample sample = captureSample(
                        "Place finger on scanner. Remaining samples: " + enrollment.getFeaturesNeeded()
                );
                DPFPFeatureSet features = extraction.createFeatureSet(sample, DPFPDataPurpose.DATA_PURPOSE_ENROLLMENT);
                enrollment.addFeatures(features);
            }

            DPFPTemplate template = enrollment.getTemplate();
            DatabaseHelper.saveFingerprintByCnic(cnic, template.serialize());

            sendJson(exchange, 200, JsonUtils.object(
                    JsonUtils.stringField("status", "enrolled"),
                    JsonUtils.stringField("cnic", cnic)
            ));
        }
    }

    private static class IdentifyHandler extends JsonHandler {
        @Override
        protected void handleJson(HttpExchange exchange) throws Exception {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, JsonUtils.object(
                        JsonUtils.stringField("status", "error"),
                        JsonUtils.stringField("message", "POST required")
                ));
                return;
            }

            DPFPSample sample = captureSample("Place finger for identification");
            DPFPFeatureExtraction extraction = DPFPGlobal.getFeatureExtractionFactory().createFeatureExtraction();
            DPFPFeatureSet verificationFeatures =
                    extraction.createFeatureSet(sample, DPFPDataPurpose.DATA_PURPOSE_VERIFICATION);
            DPFPVerification verification = DPFPGlobal.getVerificationFactory().createVerification();
            verification.setFARRequested(DPFPVerification.MEDIUM_SECURITY_FAR);

            List<DatabaseHelper.EmployeeRecord> employees = DatabaseHelper.getEmployeesWithFingerprints();

            for (DatabaseHelper.EmployeeRecord employee : employees) {
                DPFPTemplate template = DPFPGlobal.getTemplateFactory().createTemplate(employee.fingerprint);
                DPFPVerificationResult result = verification.verify(verificationFeatures, template);

                if (result.isVerified()) {
                    sendJson(exchange, 200, JsonUtils.object(
                            JsonUtils.stringField("status", "matched"),
                            JsonUtils.numberField("employeeId", employee.id),
                            JsonUtils.stringField("name", employee.name),
                            JsonUtils.stringField("cnic", employee.cnic),
                            JsonUtils.stringField("department", employee.department == null ? "" : employee.department),
                            JsonUtils.decimalField("score", result.getFalseAcceptRate())
                    ));
                    return;
                }
            }

            sendJson(exchange, 404, JsonUtils.object(
                    JsonUtils.stringField("status", "no_match"),
                    JsonUtils.stringField("message", "no employee matched the scanned fingerprint")
            ));
        }
    }
}
