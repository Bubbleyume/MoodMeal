# Run locally. Reads the existing Windows user variable without displaying it.
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '../..')
$env:FDC_API_KEY = [Environment]::GetEnvironmentVariable('FDC_API_KEY', 'User')
if ([string]::IsNullOrWhiteSpace($env:FDC_API_KEY)) { throw 'FDC_API_KEY is not configured for this Windows user.' }
$candidateIds = @(168482,168483,168588,168875,169124,169640,169704,169991,170401,170556,170567,171287,171705,172688,173424,173904,173944,2346396,2705422,2705423,2705424)
foreach ($fdcId in $candidateIds) {
    python docs/usda/fdc_review.py fetch $fdcId --skip-existing
    if ($LASTEXITCODE -ne 0) { throw 'Fetch stopped. Resolve the reported error before continuing.' }
    Start-Sleep -Milliseconds 500
}
Write-Output 'Candidate reports saved for review only. No records were imported or approved.'
