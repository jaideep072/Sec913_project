package mth.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "rolesmapping")
public class Rolesmapping {

    @Id
    private String id;

    Long role;
    Long mid;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getRole() { return role; }
    public void setRole(Long role) { this.role = role; }

    public Long getMid() { return mid; }
    public void setMid(Long mid) { this.mid = mid; }
}
