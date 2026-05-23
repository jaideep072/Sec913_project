1) Update pom.xml and maven updates
2) configure the application.properties file
3)create a database in postgressql : sec913mth


INSERT INTO roles (role, rolename) VALUES
(1, 'User'),
(2, 'Manager'),
(3, 'Admin');

INSERT INTO rolesmapping (mid, role) VALUES
(1, 1),
(2, 1),
(5, 1),
(1, 2),
(2, 2),
(3, 2),
(5, 2),
(1, 3),
(2, 3),
(3, 3),
(4, 3),
(5, 3);



INSERT INTO menus (mid, icon, menu) VALUES
(1, 'dashboard.png', 'Dashboard'),
(2, 'mytask.png', 'My Task'),
(3, 'taskmanager.png', 'Task Manager'),
(4, 'usermanager.png', 'User Manager'),
(5, 'myprofile.png', 'My Profile');



INSERT INTO users (email, fullname, password, phone, role, status) VALUES
( 'elan77@gmail.com', 'elango', '1234', '9488363541', 3, 1),
( 'manager@gmail.com', 'manager', '1234', '989898989', 2, 1),
( 'user@gmail.com', 'user', '1234', '7676767676', 1, 1);
