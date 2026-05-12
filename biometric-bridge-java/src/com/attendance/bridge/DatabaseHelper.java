package com.attendance.bridge;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class DatabaseHelper {
    private static final String URL = System.getenv().getOrDefault(
            "ATTENDANCE_DB_URL",
            "jdbc:mysql://localhost:3306/attendance_db?useSSL=false&allowPublicKeyRetrieval=true"
    );
    private static final String USER = System.getenv().getOrDefault("ATTENDANCE_DB_USER", "root");
    private static final String PASSWORD = System.getenv().getOrDefault("ATTENDANCE_DB_PASSWORD", "admin123");

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("MySQL JDBC driver not found", e);
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    public static void saveFingerprintByCnic(String cnic, byte[] template) throws SQLException {
        String sql = "UPDATE employees SET fingerprint = ? WHERE cnic = ?";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setBytes(1, template);
            statement.setString(2, cnic);
            statement.executeUpdate();
        }
    }

    public static List<EmployeeRecord> getEmployeesWithFingerprints() throws SQLException {
        List<EmployeeRecord> employees = new ArrayList<>();
        String sql = "SELECT id, name, cnic, department, fingerprint FROM employees WHERE fingerprint IS NOT NULL";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {

            while (resultSet.next()) {
                EmployeeRecord employee = new EmployeeRecord();
                employee.id = resultSet.getInt("id");
                employee.name = resultSet.getString("name");
                employee.cnic = resultSet.getString("cnic");
                employee.department = resultSet.getString("department");
                employee.fingerprint = resultSet.getBytes("fingerprint");
                employees.add(employee);
            }
        }

        return employees;
    }

    public static boolean employeeExistsByCnic(String cnic) throws SQLException {
        String sql = "SELECT id FROM employees WHERE cnic = ? LIMIT 1";

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, cnic);

            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        }
    }

    public static class EmployeeRecord {
        public int id;
        public String name;
        public String cnic;
        public String department;
        public byte[] fingerprint;
    }
}

