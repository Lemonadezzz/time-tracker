"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Plus, Edit } from "lucide-react"

interface User {
  _id: string
  username: string
  role: 'admin' | 'user' | 'developer'
  createdAt: string
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' })
  const [creating, setCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editData, setEditData] = useState({ username: '', password: '' })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/users', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('authToken')
      await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })
      loadUsers() // Reload users
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  const createUser = async () => {
    if (!newUser.username || !newUser.password) return
    
    setCreating(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      })
      
      if (response.ok) {
        setNewUser({ username: '', password: '', role: 'user' })
        setShowCreateForm(false)
        loadUsers()
      }
    } catch (error) {
      console.error('Failed to create user:', error)
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (user: User) => {
    setEditingUser(user._id)
    setEditData({ username: user.username, password: '' })
  }

  const updateUser = async () => {
    if (!editData.username) return
    
    setUpdating(true)
    try {
      const token = localStorage.getItem('authToken')
      await fetch('/api/admin/edit-user', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: editingUser,
          username: editData.username,
          password: editData.password
        })
      })
      
      setEditingUser(null)
      setEditData({ username: '', password: '' })
      loadUsers()
    } catch (error) {
      console.error('Failed to update user:', error)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </div>
              <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showCreateForm && (
              <div className="mb-6 p-4 border rounded-lg space-y-4">
                <h3 className="font-medium">Create New Team Member</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Role:</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                    <Button onClick={createUser} disabled={creating}>
                      {creating ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {loading ? (
              <p>Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground">No team members found.</p>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user._id} className="p-4 border rounded-lg">
                    {editingUser === user._id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Username</Label>
                            <Input
                              value={editData.username}
                              onChange={(e) => setEditData({...editData, username: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>New Password (optional)</Label>
                            <Input
                              type="password"
                              value={editData.password}
                              onChange={(e) => setEditData({...editData, password: e.target.value})}
                              placeholder="Leave blank to keep current"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={updateUser} disabled={updating} size="sm">
                            {updating ? 'Updating...' : 'Save'}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingUser(null)} size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{user.username}</h3>
                          <p className="text-sm text-muted-foreground">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground">Role:</span>
                          <Select value={user.role} onValueChange={(value) => updateUserRole(user._id, value)}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}