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

# Se FTP_STORED_SESSION for definida, usamos o nome da sessao salva no
# registro do WinSCP do usuario do runner (HKCU\Software\Martin Prikryl\WinSCP 2\Sessions).
# Garante 100% de compatibilidade com o que funciona na GUI. As outras vars
# (FTP_HOST/FTP_USER/...) ficam ignoradas nesse modo, exceto FTP_SERVER_DIR.
$useStoredSession = -not [string]::IsNullOrEmpty($env:FTP_STORED_SESSION)

# Valida vars obrigatorias
$requiredVars = if ($useStoredSession) {
    @('FTP_STORED_SESSION', 'FTP_SERVER_DIR')
} else {
    @('FTP_HOST', 'FTP_USER', 'FTP_PASSWORD', 'FTP_PORT', 'FTP_PROTOCOL', 'FTP_SERVER_DIR')
}
foreach ($name in $requiredVars) {
    if (-not (Get-Item -LiteralPath "env:$name" -ErrorAction SilentlyContinue).Value) {
        throw "Variavel de ambiente '$name' nao definida."
    }
}

if ($useStoredSession) {
    Write-Output "Modo: sessao SALVA do WinSCP"
    Write-Output "Sessao:    $($env:FTP_STORED_SESSION)"
} else {
    Write-Output "Modo: ad-hoc"
    Write-Output "Protocolo: $($env:FTP_PROTOCOL)"
    Write-Output "Host:      $($env:FTP_HOST):$($env:FTP_PORT)"
}
Write-Output "Remoto:    $($env:FTP_SERVER_DIR)"
Write-Output "Local:     $(Get-Location)"

# Mapeia protocolo para WinSCP (so usado em modo ad-hoc)
$scheme = if ($useStoredSession) { '' } else {
    switch ($env:FTP_PROTOCOL.ToLower()) {
        'ftps' { 'ftpes' }
        'sftp' { 'sftp' }
        default { 'ftp' }
    }
}

# URL-encode usuario/senha — so usado em modo ad-hoc
$userEnc = if ($useStoredSession) { '' } else { [uri]::EscapeDataString($env:FTP_USER) }
$passEnc = if ($useStoredSession) { '' } else { [uri]::EscapeDataString($env:FTP_PASSWORD) }
$hostPort = if ($useStoredSession) { '' } else { "$($env:FTP_HOST):$($env:FTP_PORT)" }

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

# Raw settings — espelha EXATAMENTE a sessao salva do WinSCP da GUI
# (extraido do registro: HKCU\Software\Martin Prikryl\WinSCP 2\Sessions\luisa mell):
#   - Ftps=3        TLS explicit OPORTUNISTA (nao mandatorio).
#                   E o que faz funcionar — Ftps=2 (mandatorio) era rejeitado
#                   pelo vsftpd da hospedagem no canal de dados (425 EPERM).
#   - ProxyPort=0   default
#   - certificate   cert e wildcard *.sslbr.net que nao bate com hostname,
#                   confiamos pelo fingerprint SHA-256.
$rawSettings = switch ($env:FTP_PROTOCOL.ToLower()) {
    'ftp'  { '' }
    'ftps' { '-rawsettings Ftps=3 ProxyPort=0 -certificate="99:11:bc:a5:a2:f2:f8:19:bc:80:b4:14:7e:05:d4:b8:49:99:c6:73:f6:b8:9a:50:c1:5b:6f:52:22:f9:dd:ee"' }
    'sftp' { '' }
    default { '' }
}

# Monta o comando "open" do WinSCP
# - Modo sessao salva: passa o nome da sessao (encoded) entre aspas.
# - Modo ad-hoc: monta a URL com credenciais + rawsettings.
$openCmd = if ($useStoredSession) {
    "open `"$($env:FTP_STORED_SESSION)`""
} else {
    "open ${scheme}://${userEnc}:${passEnc}@${env:FTP_HOST}/ $rawSettings"
}

# Monta o script WinSCP
# IMPORTANTE: usamos arrays + join pra evitar pegadinhas de here-string
# com indentacao/encoding/escape entre YAML+PowerShell.
$scriptLines = @(
    'option batch abort',
    'option confirm off',
    'option transfer binary',
    $openCmd,
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

# Log do script (com senha mascarada se modo ad-hoc)
Write-Output ""
Write-Output "----- WinSCP script -----"
if ($useStoredSession) {
    $scriptContent | Write-Output
} else {
    $scriptContent -replace [regex]::Escape($passEnc), '***' | Write-Output
}
Write-Output "-------------------------"
Write-Output ""

# Executa WinSCP
# Log do WinSCP vai pra um path persistente (sobrevive ao cleanup do runner).
# Em modo sessao salva, NAO passamos /ini=nul (precisamos do registro do usuario).
$persistentLog = 'C:\actions-runner\last-deploy.log'
$winscpArgs = @(
    "/script=$scriptFile",
    "/log=$persistentLog",
    '/loglevel=1'
)
if (-not $useStoredSession) {
    # Em modo ad-hoc, isolamos a config para nao acidentalmente herdar do registro.
    $winscpArgs += '/ini=nul'
}
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
