#!/usr/bin/env bash
# Validates GEMINI_API_KEY in .env is set to a real key (not a placeholder).
validate_gemini_key_in_env() {
  local env_file="${1:-.env}"
  if [[ ! -f "$env_file" ]]; then
    echo "Error: $env_file not found"
    return 1
  fi
  local key
  key=$(grep -E '^GEMINI_API_KEY=' "$env_file" | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [[ -z "$key" || "$key" == "your_gemini_api_key_here" || "$key" == *"your_gemini"* ]]; then
    echo "Error: Set a valid GEMINI_API_KEY in $env_file before continuing."
    echo "Get a key at https://aistudio.google.com/apikey"
    return 1
  fi
  return 0
}
