FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY . .
# Make mvnw executable and build the application
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.war app.war
EXPOSE 8001
CMD ["java", "-jar", "app.war"]
