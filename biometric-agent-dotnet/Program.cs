using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;

var port = 8091;
var listener = new TcpListener(IPAddress.Loopback, port);
var jsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true
};
listener.Start();

Console.WriteLine($"Biometric agent listening on http://127.0.0.1:{port}");

while (true)
{
    var client = await listener.AcceptTcpClientAsync();
    _ = Task.Run(() => HandleClientAsync(client));
}

async Task HandleClientAsync(TcpClient client)
{
    using (client)
    using (var stream = client.GetStream())
    {
        try
        {
            using var reader = new StreamReader(stream, Encoding.UTF8, leaveOpen: true);

            var requestLine = await reader.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(requestLine))
            {
                return;
            }

            var parts = requestLine.Split(' ');
            var method = parts.Length > 0 ? parts[0].Trim().ToUpperInvariant() : "GET";
            var target = parts.Length > 1 ? parts[1].Trim() : "/";

            var contentLength = 0;
            string? line;
            while (!string.IsNullOrEmpty(line = await reader.ReadLineAsync()))
            {
                var separator = line.IndexOf(':');
                if (separator <= 0)
                {
                    continue;
                }

                var headerName = line[..separator].Trim();
                var headerValue = line[(separator + 1)..].Trim();

                if (headerName.Equals("Content-Length", StringComparison.OrdinalIgnoreCase))
                {
                    int.TryParse(headerValue, out contentLength);
                }
            }

            var body = string.Empty;
            if (contentLength > 0)
            {
                var buffer = new char[contentLength];
                var offset = 0;
                while (offset < contentLength)
                {
                    var read = await reader.ReadAsync(buffer, offset, contentLength - offset);
                    if (read <= 0)
                    {
                        break;
                    }

                    offset += read;
                }

                body = new string(buffer, 0, offset);
            }

            if (method == "OPTIONS")
            {
                await WriteResponseAsync(stream, 204, new { status = "ok" });
                return;
            }

            if (method == "GET" && target == "/health")
            {
                await WriteResponseAsync(stream, 200, new
                {
                    status = "ok",
                    mode = "local-agent",
                    message = "Local biometric agent is ready.",
                    fingerprintEnrollRunning = Process.GetProcessesByName("FingerprintEnrollUi").Length,
                    fingerprintVerifyRunning = Process.GetProcessesByName("FingerprintIdentifyUi").Length
                });
                return;
            }

            if (method == "POST" && target == "/fingerprint/enroll")
            {
                var payload = string.IsNullOrWhiteSpace(body)
                    ? new EnrollRequest()
                    : JsonSerializer.Deserialize<EnrollRequest>(body, jsonOptions) ?? new EnrollRequest();

                if (payload.EmployeeId <= 0)
                {
                    await WriteResponseAsync(stream, 400, new { status = "error", message = "employeeId is required" });
                    return;
                }

                var exePath = ResolveHelperExe("fingerprint-enroll-ui", "FingerprintEnrollUi.exe");
                if (exePath == null)
                {
                    await WriteResponseAsync(stream, 500, new { status = "error", message = "Fingerprint enrollment helper was not found." });
                    return;
                }

                var running = Process.GetProcessesByName("FingerprintEnrollUi");
                if (running.Length > 0)
                {
                    FocusProcessWindow(running[0]);
                    await WriteResponseAsync(stream, 200, new
                    {
                        status = "focused",
                        message = "Fingerprint enrollment UI is already running and has been brought to the front.",
                        processIds = running.Select(p => p.Id).ToArray()
                    });
                    return;
                }

                var args = $"--employee-id {payload.EmployeeId} --finger-code {payload.FingerCode ?? "right_index"} --backend-url {payload.BackendUrl ?? "http://127.0.0.1:4000"}";
                Process.Start(new ProcessStartInfo
                {
                    FileName = exePath,
                    Arguments = args,
                    UseShellExecute = true,
                    WorkingDirectory = Path.GetDirectoryName(exePath),
                    WindowStyle = ProcessWindowStyle.Normal
                });

                await Task.Delay(1200);
                FocusFirstProcessByName("FingerprintEnrollUi");

                await WriteResponseAsync(stream, 200, new
                {
                    status = "launched",
                    message = "Fingerprint enrollment UI launched.",
                    employeeId = payload.EmployeeId,
                    fingerCode = payload.FingerCode ?? "right_index"
                });
                return;
            }

            if (method == "POST" && target == "/fingerprint/verify")
            {
                var payload = string.IsNullOrWhiteSpace(body)
                    ? new VerifyRequest()
                    : JsonSerializer.Deserialize<VerifyRequest>(body, jsonOptions) ?? new VerifyRequest();

                var exePath = ResolveHelperExe("fingerprint-identify-ui", "FingerprintIdentifyUi.exe");
                if (exePath == null)
                {
                    await WriteResponseAsync(stream, 500, new { status = "error", message = "Fingerprint verification helper was not found." });
                    return;
                }

                var running = Process.GetProcessesByName("FingerprintIdentifyUi");
                if (running.Length > 0)
                {
                    FocusProcessWindow(running[0]);
                    await WriteResponseAsync(stream, 200, new
                    {
                        status = "focused",
                        message = "Fingerprint verification UI is already running and has been brought to the front.",
                        processIds = running.Select(p => p.Id).ToArray()
                    });
                    return;
                }

                var args = $"--backend-url {payload.BackendUrl ?? "http://127.0.0.1:4000"}";
                if (payload.EmployeeId.HasValue && payload.EmployeeId.Value > 0)
                {
                    args += $" --employee-id {payload.EmployeeId.Value}";
                }
                Process.Start(new ProcessStartInfo
                {
                    FileName = exePath,
                    Arguments = args,
                    UseShellExecute = true,
                    WorkingDirectory = Path.GetDirectoryName(exePath),
                    WindowStyle = ProcessWindowStyle.Normal
                });

                await Task.Delay(1200);
                FocusFirstProcessByName("FingerprintIdentifyUi");

                await WriteResponseAsync(stream, 200, new
                {
                    status = "launched",
                    message = "Fingerprint verification UI launched."
                });
                return;
            }

            await WriteResponseAsync(stream, 404, new { status = "error", message = "Not found" });
        }
        catch (Exception ex)
        {
            await WriteResponseAsync(stream, 500, new { status = "error", message = ex.Message });
        }
    }
}

static string? ResolveHelperExe(string projectFolder, string exeName)
{
    var current = new DirectoryInfo(AppContext.BaseDirectory);
    while (current != null)
    {
        var candidate = Path.Combine(current.FullName, projectFolder, "bin", "Release", "net48", exeName);
        if (File.Exists(candidate))
        {
            return candidate;
        }

        current = current.Parent;
    }

    return null;
}

static async Task WriteResponseAsync(NetworkStream stream, int statusCode, object payload)
{
    var reasonPhrase = statusCode switch
    {
        200 => "OK",
        204 => "No Content",
        404 => "Not Found",
        500 => "Internal Server Error",
        _ => "OK"
    };

    var json = JsonSerializer.Serialize(payload);
    var bodyBytes = Encoding.UTF8.GetBytes(json);
    var headers = new StringBuilder();
    headers.Append($"HTTP/1.1 {statusCode} {reasonPhrase}\r\n");
    headers.Append("Content-Type: application/json; charset=utf-8\r\n");
    headers.Append("Access-Control-Allow-Origin: *\r\n");
    headers.Append("Access-Control-Allow-Headers: Content-Type, Authorization\r\n");
    headers.Append("Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n");
    headers.Append($"Content-Length: {bodyBytes.Length}\r\n");
    headers.Append("Connection: close\r\n\r\n");

    var headerBytes = Encoding.UTF8.GetBytes(headers.ToString());
    await stream.WriteAsync(headerBytes, 0, headerBytes.Length);
    if (statusCode != 204)
    {
        await stream.WriteAsync(bodyBytes, 0, bodyBytes.Length);
    }
}

static void FocusFirstProcessByName(string processName)
{
    var process = Process.GetProcessesByName(processName).FirstOrDefault();
    if (process != null)
    {
        FocusProcessWindow(process);
    }
}

static void FocusProcessWindow(Process process)
{
    try
    {
        process.Refresh();
        var handle = process.MainWindowHandle;
        if (handle == IntPtr.Zero)
        {
            return;
        }

        NativeMethods.ShowWindowAsync(handle, 9);
        NativeMethods.SetForegroundWindow(handle);
    }
    catch
    {
        // Ignore focus errors; the helper is still running.
    }
}

sealed class EnrollRequest
{
    public int EmployeeId { get; set; }
    public string? FingerCode { get; set; }
    public string? BackendUrl { get; set; }
}

sealed class VerifyRequest
{
    public string? BackendUrl { get; set; }
    public int? EmployeeId { get; set; }
}

static class NativeMethods
{
    [DllImport("user32.dll")]
    internal static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    internal static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
}
