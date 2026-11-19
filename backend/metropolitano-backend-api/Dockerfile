FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace
COPY . .
RUN chmod +x mvnw && ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/target/metropolitano-backend-api-0.0.1-SNAPSHOT.jar /app/app.jar
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70.0 -XX:InitialRAMPercentage=30.0"
EXPOSE 10000
ENTRYPOINT ["sh", "-c", "exec java -jar /app/app.jar --server.port=${PORT:-10000}"]
