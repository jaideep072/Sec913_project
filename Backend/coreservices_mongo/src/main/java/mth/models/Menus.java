package mth.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "menus")
public class Menus {

    @Id
    private String id;

    Long mid;
    String menu;
    String icon;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getMid() { return mid; }
    public void setMid(Long mid) { this.mid = mid; }

    public String getMenu() { return menu; }
    public void setMenu(String menu) { this.menu = menu; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}
