FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the jar file (you'll need to build it first)
COPY target/server-*.jar app.jar

# Expose the port your Spring Boot app runs on
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]