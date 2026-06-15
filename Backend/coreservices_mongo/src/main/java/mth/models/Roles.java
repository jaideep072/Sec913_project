package mth.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "roles")
public class Roles {

    @Id
    private String id;

    Long role;
    String rolename;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getRole() { return role; }
    public void setRole(Long role) { this.role = role; }

    public String getRolename() { return rolename; }
    public void setRolename(String rolename) { this.rolename = rolename; }
}
