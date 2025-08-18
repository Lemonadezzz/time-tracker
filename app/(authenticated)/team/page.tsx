"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Clock, Plus, Edit, Trash2, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  _id: string
  username: string
  email: string
  role: 'admin' | 'user' | 'developer'
  createdAt: string
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' as const })
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      })
      
      if (response.ok) {
        toast({ title: "Success", description: "User added successfully" })
        setNewUser({ username: '', email: '', password: '', role: 'user' })
        setShowAddDialog(false)
        loadUsers()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to add user", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add user", variant: "destructive" })
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: editingUser.username,
          email: editingUser.email,
          role: editingUser.role
        })
      })
      
      if (response.ok) {
        toast({ title: "Success", description: "User updated successfully" })
        setShowEditDialog(false)
        setEditingUser(null)
        loadUsers()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to update user", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        toast({ title: "Success", description: "User deleted successfully" })
        loadUsers()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to delete user", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'developer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-6 md:pt-6">
      <div className="max-w-6xl md:mx-auto space-y-3 md:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
            <h1 className="text-xl md:text-2xl font-bold">Team Management</h1>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                />
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'user' | 'developer') => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleAddUser} className="flex-1">Add User</Button>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-base md:text-xl">Team Members</span>
              </div>
              <Badge variant="secondary" className="hidden md:inline-flex">
                {users.length} members
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>Loading team members...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No team members found</p>
              </div>
            ) : (
              <div className="h-[calc(100vh-300px)] overflow-y-auto">
                <div className="space-y-1">
                  {users.map((user) => {
                  return (
                    <div key={user._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{user.username}</p>
                          <Badge className={`text-xs px-1.5 py-0.5 ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingUser(user)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <Input
                placeholder="Username"
                value={editingUser.username}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, username: e.target.value } : null)}
              />
              <Input
                placeholder="Email"
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
              />
              <Select value={editingUser.role} onValueChange={(value: 'admin' | 'user' | 'developer') => setEditingUser(prev => prev ? { ...prev, role: value } : null)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={handleEditUser} className="flex-1">Update User</Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}