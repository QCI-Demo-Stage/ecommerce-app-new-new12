{{/*
Expand the name of the chart.
*/}}
{{- define "ecommerce-staging.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "ecommerce-staging.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "ecommerce-staging.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "ecommerce-staging.labels" -}}
helm.sh/chart: {{ include "ecommerce-staging.chart" . }}
{{ include "ecommerce-staging.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "ecommerce-staging.selectorLabels" -}}
app.kubernetes.io/name: {{ include "ecommerce-staging.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service account name
*/}}
{{- define "ecommerce-staging.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "ecommerce-staging.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Backend fullname
*/}}
{{- define "ecommerce-staging.backend.fullname" -}}
{{- printf "%s-%s" (include "ecommerce-staging.fullname" .) .Values.backend.name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Frontend fullname
*/}}
{{- define "ecommerce-staging.frontend.fullname" -}}
{{- printf "%s-%s" (include "ecommerce-staging.fullname" .) .Values.frontend.name | trunc 63 | trimSuffix "-" }}
{{- end }}
