# 1) Build do React (vai para api/wwwroot)
FROM node:22-alpine AS web
WORKDIR /src/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# 2) Build do .NET 10 com o front embutido
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY api/ api/
COPY --from=web /src/api/wwwroot api/wwwroot
RUN dotnet publish api/AmigoSecreto.Api.csproj -c Release -o /app

# 3) Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
# POC: o volume do Railway é montado como root; sem isso o app não consegue gravar em /data.
USER root
ENV DATA_PATH=/data/db.json
ENTRYPOINT ["dotnet", "AmigoSecreto.Api.dll"]
