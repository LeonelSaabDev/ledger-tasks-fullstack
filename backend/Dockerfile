# syntax=docker/dockerfile:1

# ---- Build stage: the full .NET SDK (compiler, NuGet). It is thrown away; only its output is kept.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore with only the project files first: Docker caches this layer until a .csproj changes,
# so editing code does not download every NuGet package again.
COPY src/TaskManager.Domain/TaskManager.Domain.csproj src/TaskManager.Domain/
COPY src/TaskManager.Application/TaskManager.Application.csproj src/TaskManager.Application/
COPY src/TaskManager.Infrastructure/TaskManager.Infrastructure.csproj src/TaskManager.Infrastructure/
COPY src/TaskManager.Api/TaskManager.Api.csproj src/TaskManager.Api/
RUN dotnet restore src/TaskManager.Api/TaskManager.Api.csproj

COPY src/ src/
RUN dotnet publish src/TaskManager.Api/TaskManager.Api.csproj -c Release -o /app --no-restore

# ---- Runtime stage: just the ASP.NET Core runtime plus the published app.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .

# The official .NET images ship a non-root user; the app never needs root.
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "TaskManager.Api.dll"]
