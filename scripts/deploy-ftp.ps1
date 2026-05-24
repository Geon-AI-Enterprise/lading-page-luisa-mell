# ============================================================================
# Deploy FTP via WinSCP CLI
# Sincroniza o repo atual com o servidor FTP da hospedagem.
# Acionado pelo workflow .github/workflows/ftp-deploy.yml no self-hosted runner.
#
# Variaveis de ambiente esperadas:
#   FTP_HOST, FTP_USER, FTP_PASSWORD  -> credenciais (secrets do GitHub)
#   FTP_PORT, FTP_PROTOCOL, FTP_SERVER_DIR -> config (vars do GitHub)
# ============================================================================

$ErrorActionPreference = 'Stop'

# Localiza o executavel do WinSCP
$winscpCandidates = @(
    'C:\Program Files (x86)\WinSCP\WinSCP.com',
    'C:\Program Files\WinSCP\WinSCP.com',
    "$env:LOCALAPPDATA\Programs\WinSCP\WinSCP.com"
)
$winscp = $winscpCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $winscp) {
    throw "WinSCP.com nao encontrado. Caminhos testados: $($winscpCandidates -join ', ')"
}
Write-Output "WinSCP encontrado em: $winscp"

# Valida vars obrigatorias
foreach ($name in 'FTP_HOST', 'FTP_USER', 'FTP_PASSWORD', 'FTP_PORT', 'FTP_PROTOCOL', 'FTP_SERVER_DIR') {
    if (-not (Get-Item -LiteralPath "env:$name" -ErrorAction SilentlyContinue).Value) {
        throw "Variavel de ambiente '$name' nao definida."
    }
}

# Mapeia protocolo para WinSCP
$scheme = switch ($env:FTP_PROTOCOL.ToLower()) {
    'ftps' { 'ftpes' }   # FTP explicit TLS
    'sftp' { 'sftp' }
    default { 'ftp' }
}
Write-Output "Protocolo: $($env:FTP_PROTOCOL) -> WinSCP scheme '$scheme'"
Write-Output "Host:      $($env:FTP_HOST):$($env:FTP_PORT)"
Write-Output "Remoto:    $($env:FTP_SERVER_DIR)"
Write-Output "Local:     $(Get-Location)"

# URL-encode usuario/senha para o caso de terem caracteres especiais
$userEnc = [uri]::EscapeDataString($env:FTP_USER)
$passEnc = [uri]::EscapeDataString($env:FTP_PASSWORD)
$hostPort = "$($env:FTP_HOST):$($env:FTP_PORT)"

# Filemask: o que NAO subir.
# Sintaxe WinSCP: "<inclui>|<exclui>" — sem includes manda tudo;
# sufixo "/" denota diretorio.
$exclusions = @(
    '.git*/',
    '.github/',
    '.vscode/',
    '.claude/',
    'node_modules/',
    'scripts/',
    'supabase/',
    '.gitignore',
    '.editorconfig',
    'CLAUDE.md',
    '*.md',
    '.env',
    '.env.*',
    'run-log.txt'
) -join ';'
$filemask = "|$exclusions"

# Caminho local (passa pra WinSCP usando barras Windows entre aspas)
$localPath = (Get-Location).Path

# Monta o script WinSCP
# IMPORTANTE: aqui usamos arrays + join pra evitar pegadinhas de here-string
# com indentacao/encoding/escape entre YAML+PowerShell.
$scriptLines = @(
    'option batch abort',
    'option confirm off',
    'option transfer binary',
    "open ${scheme}://${userEnc}:${passEnc}@${hostPort} -passive=on -timeout=30",
    "cd `"$($env:FTP_SERVER_DIR)`"",
    "synchronize remote -filemask=`"$filemask`" `"$localPath`" .",
    'close',
    'exit'
)
$scriptContent = $scriptLines -join "`r`n"

# Salva em arquivo temp (WinSCP espera arquivo, nao stdin)
$scriptFile = [System.IO.Path]::Combine($env:RUNNER_TEMP ?? $env:TEMP, "winscp-script-$(Get-Random).txt")
Set-Content -Path $scriptFile -Value $scriptContent -Encoding ASCII

# Log do script (com senha mascarada)
Write-Output ""
Write-Output "----- WinSCP script -----"
$scriptContent -replace [regex]::Escape($passEnc), '***' | Write-Output
Write-Output "-------------------------"
Write-Output ""

# Executa WinSCP
$logFile = [System.IO.Path]::Combine($env:RUNNER_TEMP ?? $env:TEMP, "winscp-$(Get-Random).log")
$winscpArgs = @(
    "/script=$scriptFile",
    "/log=$logFile",
    '/loglevel=1',
    '/ini=nul'
)
Write-Output "Executando WinSCP..."
& $winscp @winscpArgs
$exitCode = $LASTEXITCODE

# Cleanup do script (mantem log)
Remove-Item $scriptFile -ErrorAction SilentlyContinue

if ($exitCode -ne 0) {
    Write-Output ""
    Write-Output "----- WinSCP log (ultimas 100 linhas) -----"
    if (Test-Path $logFile) {
        Get-Content $logFile -Tail 100 | Write-Output
    } else {
        Write-Output "(log nao gerado)"
    }
    Write-Output "-------------------------------------------"
    throw "WinSCP saiu com codigo $exitCode"
}

Write-Output ""
Write-Output "Deploy concluido com sucesso."
