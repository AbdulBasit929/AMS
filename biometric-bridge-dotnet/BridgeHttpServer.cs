using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace FingerprintBridge
{
    internal sealed class BridgeHttpServer : IDisposable
    {
        private readonly FingerprintCaptureService _captureService;
        private readonly JavaScriptSerializer _json = new JavaScriptSerializer();
        private readonly TcpListener _listener;
        private readonly int _port;
        private bool _disposed;

        public BridgeHttpServer(FingerprintCaptureService captureService)
        {
            _captureService = captureService;

            var portValue = Environment.GetEnvironmentVariable("BRIDGE_PORT");
            if (!int.TryParse(portValue, out _port))
            {
                _port = 8082;
            }

            _listener = new TcpListener(IPAddress.Loopback, _port);
        }

        public void Start()
        {
            _listener.Start();
            BridgeLog.Write("Fingerprint bridge listening on http://127.0.0.1:" + _port);
            Console.WriteLine("Fingerprint bridge listening on http://127.0.0.1:" + _port);
            Task.Run(ListenLoop);
        }

        private async Task ListenLoop()
        {
            while (!_disposed)
            {
                TcpClient client;
                try
                {
                    client = await _listener.AcceptTcpClientAsync();
                }
                catch
                {
                    if (_disposed)
                    {
                        return;
                    }

                    BridgeLog.Write("Listener loop caught an exception while accepting a client.");
                    continue;
                }

                _ = Task.Run(() => HandleClient(client));
            }
        }

        private async Task HandleClient(TcpClient client)
        {
            using (client)
            using (var stream = client.GetStream())
            using (var reader = new StreamReader(stream, Encoding.UTF8, false, 8192, true))
            using (var writer = new StreamWriter(stream, new UTF8Encoding(false)) { NewLine = "\r\n", AutoFlush = true })
            {
                try
                {
                    var requestLine = await reader.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(requestLine))
                    {
                        return;
                    }

                    var requestParts = requestLine.Split(' ');
                    var method = requestParts[0].Trim().ToUpperInvariant();
                    var path = requestParts.Length > 1 ? requestParts[1].Trim() : "/";

                    var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    string line;
                    while (!string.IsNullOrEmpty(line = await reader.ReadLineAsync()))
                    {
                        var separator = line.IndexOf(':');
                        if (separator > 0)
                        {
                            headers[line.Substring(0, separator).Trim()] = line.Substring(separator + 1).Trim();
                        }
                    }

                    var contentLength = 0;
                    if (headers.ContainsKey("Content-Length"))
                    {
                        int.TryParse(headers["Content-Length"], out contentLength);
                    }

                    var body = "";
                    if (contentLength > 0)
                    {
                        var buffer = new char[contentLength];
                        var read = 0;
                        while (read < contentLength)
                        {
                            var chunk = await reader.ReadAsync(buffer, read, contentLength - read);
                            if (chunk <= 0)
                            {
                                break;
                            }

                            read += chunk;
                        }

                        body = new string(buffer, 0, read);
                    }

                    if (method == "OPTIONS")
                    {
                        await WriteResponse(writer, 204, "", "text/plain; charset=utf-8");
                        return;
                    }

                    if (method == "GET" && path == "/health")
                    {
                        var result = await _captureService.CheckHealthAsync();
                        await WriteJson(writer, result.StatusCode, result);
                        return;
                    }

                    if (method == "POST" && path == "/capture-template")
                    {
                        var result = await _captureService.CaptureTemplateAsync();
                        await WriteJson(writer, result.StatusCode, result);
                        return;
                    }

                    if (method == "POST" && path == "/identify")
                    {
                        var request = string.IsNullOrWhiteSpace(body)
                            ? new IdentifyRequest()
                            : _json.Deserialize<IdentifyRequest>(body);

                        var result = await _captureService.IdentifyAsync(request);
                        await WriteJson(writer, result.StatusCode, result);
                        return;
                    }

                    await WriteJson(writer, 404, new BridgeResponse
                    {
                        StatusCode = 404,
                        Status = "error",
                        Message = "route not found"
                    });
                }
                catch (Exception ex)
                {
                    BridgeLog.Write("Request handling error: " + ex);
                    await WriteJson(writer, 500, new BridgeResponse
                    {
                        StatusCode = 500,
                        Status = "error",
                        Message = ex.Message
                    });
                }
            }
        }

        private async Task WriteJson(StreamWriter writer, int statusCode, object payload)
        {
            var json = _json.Serialize(payload);
            await WriteResponse(writer, statusCode, json, "application/json; charset=utf-8");
        }

        private static async Task WriteResponse(StreamWriter writer, int statusCode, string body, string contentType)
        {
            var reason = GetReasonPhrase(statusCode);
            var payload = body ?? "";
            var bytes = Encoding.UTF8.GetByteCount(payload);

            await writer.WriteLineAsync($"HTTP/1.1 {statusCode} {reason}");
            await writer.WriteLineAsync("Access-Control-Allow-Origin: *");
            await writer.WriteLineAsync("Access-Control-Allow-Headers: Content-Type");
            await writer.WriteLineAsync("Access-Control-Allow-Methods: GET,POST,OPTIONS");
            await writer.WriteLineAsync("Connection: close");
            await writer.WriteLineAsync("Content-Type: " + contentType);
            await writer.WriteLineAsync("Content-Length: " + bytes);
            await writer.WriteLineAsync();
            await writer.WriteAsync(payload);
        }

        private static string GetReasonPhrase(int statusCode)
        {
            switch (statusCode)
            {
                case 200: return "OK";
                case 204: return "No Content";
                case 400: return "Bad Request";
                case 404: return "Not Found";
                case 408: return "Request Timeout";
                case 409: return "Conflict";
                case 422: return "Unprocessable Entity";
                case 500: return "Internal Server Error";
                case 503: return "Service Unavailable";
                default: return "OK";
            }
        }

        public void Dispose()
        {
            _disposed = true;
            BridgeLog.Write("Shutting down fingerprint bridge listener.");
            _listener.Stop();
        }
    }
}
