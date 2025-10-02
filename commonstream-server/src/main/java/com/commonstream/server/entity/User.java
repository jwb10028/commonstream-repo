package com.commonstream.server.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Email
    @NotBlank
    @Column(unique = true, nullable = false)
    private String email;
    
    @NotBlank
    @Size(min = 3, max = 100)
    @Column(unique = true, nullable = false)
    private String username;
    
    @NotBlank
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private ZonedDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;
    
    // Constructors, getters, setters
    public User() {}
    
    // Add all getters and setters here...
    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}
    
    public String getEmail() {return email;}
    public void setEmail(String email) {this.email = email;}
    
    public String getUsername() {return username;}
    public void setUsername(String username) {this.username = username;}
    
    public String getPasswordHash() {return passwordHash;}
    public void setPasswordHash(String passwordHash) {this.passwordHash = passwordHash;}
    
    public Role getRole() {return role;}
    public void setRole(Role role) {this.role = role;}
    
    public ZonedDateTime getCreatedAt() {return createdAt;}
    public void setCreatedAt(ZonedDateTime createdAt) {this.createdAt = createdAt;}
    
    public ZonedDateTime getUpdatedAt() {return updatedAt;}
    public void setUpdatedAt(ZonedDateTime updatedAt) {this.updatedAt = updatedAt;}
    
    public enum Role {
        USER, ADMIN, MODERATOR
    }
}