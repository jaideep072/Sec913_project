FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app
COPY . .
# Make mvnw executable and build the application
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.war app.war
EXPOSE 8001
CMD ["java", "-jar", "app.war"]
