package com.attendance.bridge;

import java.nio.charset.StandardCharsets;

public class JsonUtils {
    private JsonUtils() {
    }

    public static String readBody(byte[] bytes) {
        return new String(bytes, StandardCharsets.UTF_8);
    }

    public static String getJsonString(String body, String key) {
        String marker = "\"" + key + "\"";
        int keyIndex = body.indexOf(marker);

        if (keyIndex < 0) {
            return "";
        }

        int colonIndex = body.indexOf(':', keyIndex);
        if (colonIndex < 0) {
            return "";
        }

        int firstQuote = body.indexOf('"', colonIndex + 1);
        if (firstQuote < 0) {
            return "";
        }

        int secondQuote = body.indexOf('"', firstQuote + 1);
        if (secondQuote < 0) {
            return "";
        }

        return body.substring(firstQuote + 1, secondQuote).trim();
    }

    public static String escape(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }

    public static String object(String... pairs) {
        StringBuilder builder = new StringBuilder("{");

        for (int i = 0; i < pairs.length; i++) {
            builder.append(pairs[i]);
            if (i < pairs.length - 1) {
                builder.append(',');
            }
        }

        builder.append('}');
        return builder.toString();
    }

    public static String stringField(String key, String value) {
        return "\"" + key + "\":\"" + escape(value == null ? "" : value) + "\"";
    }

    public static String numberField(String key, int value) {
        return "\"" + key + "\":" + value;
    }

    public static String decimalField(String key, int value) {
        return "\"" + key + "\":" + value;
    }
}

