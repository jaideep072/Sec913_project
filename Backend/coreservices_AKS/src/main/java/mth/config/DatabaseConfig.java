package mth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() throws URISyntaxException {
        if (databaseUrl != null && !databaseUrl.isEmpty() && databaseUrl.startsWith("postgres://")) {
            URI dbUri = new URI(databaseUrl);
            String username = dbUri.getUserInfo().split(":")[0];
            String password = dbUri.getUserInfo().split(":")[1];
            int port = dbUri.getPort() == -1 ? 5432 : dbUri.getPort();
            String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + ':' + port + dbUri.getPath();

            System.out.println("======> CONSTRUCTED JDBC URL: " + dbUrl);

            return DataSourceBuilder.create()
                    .url(dbUrl)
                    .username(username)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
        }
        
        // Fallback for local development
        System.out.println("======> FALLING BACK TO LOCALHOST JDBC URL");
        return DataSourceBuilder.create()
                .url("jdbc:postgresql://localhost:5432/Project_AKS")
                .username("postgres")
                .password("cybersec123")
                .driverClassName("org.postgresql.Driver")
                .build();
    }
}
