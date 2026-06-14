package mth.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() throws URISyntaxException {
        String databaseUrl = System.getenv("DATABASE_URL");
        
        System.out.println("======> RAW DATABASE_URL FROM OS: " + databaseUrl);

        if (databaseUrl == null || databaseUrl.trim().isEmpty()) {
            throw new IllegalStateException("\n\n======> FATAL ERROR: DATABASE_URL environment variable is missing or empty! " +
                    "Render did not inject the database connection string. <======\n\n");
        }

        if (!databaseUrl.startsWith("postgres")) {
            throw new IllegalStateException("\n\n======> FATAL ERROR: DATABASE_URL does not start with postgres! Value: " + databaseUrl + " <======\n\n");
        }

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
        config.setConnectionTimeout(120000); 
        config.setInitializationFailTimeout(0); 
        
        return new HikariDataSource(config);
    }
}
