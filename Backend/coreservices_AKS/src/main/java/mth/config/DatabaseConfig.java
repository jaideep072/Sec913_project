package mth.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
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

            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(dbUrl);
            config.setUsername(username);
            config.setPassword(password);
            config.setDriverClassName("org.postgresql.Driver");
            // Render Free Tier Postgres can take > 50s to spin up.
            config.setConnectionTimeout(120000); // 120 seconds
            config.setInitializationFailTimeout(0); // 0 means fail fast if connection cannot be established after timeout
            
            return new HikariDataSource(config);
        }
        
        // Fallback for local development
        System.out.println("======> FALLING BACK TO LOCALHOST JDBC URL");
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://localhost:5432/Project_AKS");
        config.setUsername("postgres");
        config.setPassword("cybersec123");
        config.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(config);
    }
}
