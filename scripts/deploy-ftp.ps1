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

# Raw settings — espelha o que a GUI do WinSCP usa pra conectar nessa
# hospedagem (extraido via "Generate Session URL/code"). So precisa:
#   - ProxyPort=0  (default da GUI)
#   - certificate=<fingerprint>  (cert do servidor e wildcard *.sslbr.net
#     que nao bate com hostname, mas confiamos pelo fingerprint SHA-256)
# Quando FTP_PROTOCOL=ftp (plain), nao precisa de cert nem proxy override.
$rawSettings = switch ($env:FTP_PROTOCOL.ToLower()) {
    'ftp'  { '' }
    'ftps' { '-rawsettings ProxyPort=0 -certificate="99:11:bc:a5:a2:f2:f8:19:bc:80:b4:14:7e:05:d4:b8:49:99:c6:73:f6:b8:9a:50:c1:5b:6f:52:22:f9:dd:ee"' }
    'sftp' { '' }
    default { '' }
}

# Monta o script WinSCP
# IMPORTANTE: aqui usamos arrays + join pra evitar pegadinhas de here-string
# com indentacao/encoding/escape entre YAML+PowerShell.
$scriptLines = @(
    'option batch abort',
    'option confirm off',
    'option transfer binary',
    # Espelha o que a GUI do WinSCP exporta: host/ (com '/' final, sem porta
    # explicita), sem -passive (default auto), sem -timeout.
    "open ${scheme}://${userEnc}:${passEnc}@${env:FTP_HOST}/ $rawSettings",
    "cd `"$($env:FTP_SERVER_DIR)`"",
    "synchronize remote -filemask=`"$filemask`" `"$localPath`" .",
    'close',
    'exit'
)
$scriptContent = $scriptLines -join "`r`n"

# Diretorio temp (RUNNER_TEMP existe no contexto do GitHub Actions; fallback p/ TEMP)
$tempDir = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { $env:TEMP }

# Salva em arquivo temp (WinSCP espera arquivo, nao stdin)
$scriptFile = [System.IO.Path]::Combine($tempDir, "winscp-script-$(Get-Random).txt")
Set-Content -Path $scriptFile -Value $scriptContent -Encoding ASCII

# Log do script (com senha mascarada)
Write-Output ""
Write-Output "----- WinSCP script -----"
$scriptContent -replace [regex]::Escape($passEnc), '***' | Write-Output
Write-Output "-------------------------"
Write-Output ""

# Executa WinSCP
# Log do WinSCP vai pra um path persistente (sobrevive ao cleanup do runner)
# E sempre dumpado no stdout do step pra aparecer no GitHub Actions UI.
$persistentLog = 'C:\actions-runner\last-deploy.log'
$winscpArgs = @(
    "/script=$scriptFile",
    "/log=$persistentLog",
    '/loglevel=1',
    '/ini=nul'
)
Write-Output "Executando WinSCP..."
& $winscp @winscpArgs
$exitCode = $LASTEXITCODE

# Cleanup do script
Remove-Item $scriptFile -ErrorAction SilentlyContinue

# SEMPRE dumpa o log (ate quando sucesso, ajuda em debug futuro)
Write-Output ""
Write-Output "===== WinSCP log =====`r`n"
if (Test-Path $persistentLog) {
    Get-Content $persistentLog | Write-Output
} else {
    Write-Output "(log nao gerado em $persistentLog)"
}
Write-Output "===== fim do log ====="

if ($exitCode -ne 0) {
    throw "WinSCP saiu com codigo $exitCode"
}

Write-Output ""
Write-Output "Deploy concluido com sucesso."
