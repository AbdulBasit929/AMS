namespace FingerprintBridge
{
    internal sealed class IdentifyRequest
    {
        public IdentifyCandidate[] Candidates { get; set; }
    }

    internal sealed class IdentifyCandidate
    {
        public int EmployeeId { get; set; }
        public string Cnic { get; set; }
        public string Name { get; set; }
        public string TemplateBase64 { get; set; }
    }

    internal sealed class CandidateTemplate
    {
        public int EmployeeId { get; set; }
        public string Cnic { get; set; }
        public string Name { get; set; }
        public DPFP.Template Template { get; set; }
    }

    internal sealed class BridgeResponse
    {
        public int StatusCode { get; set; }
        public string Status { get; set; }
        public string Message { get; set; }
        public string TemplateBase64 { get; set; }
        public int SampleCount { get; set; }
        public int EmployeeId { get; set; }
        public string Cnic { get; set; }
        public string Name { get; set; }
        public int Score { get; set; }
    }
}
