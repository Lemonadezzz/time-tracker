"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Users, Clock, Plus, Edit, Trash2, UserPlus, Key, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"

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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordUserId, setPasswordUserId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState('')
  // Removed useToast hook

  useEffect(() => {
    const role = localStorage.getItem('userRole') || ''
    setCurrentUserRole(role)
  }, [])

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
        toast.success("User created", {
          description: (
            <div>
              <div>User added successfully</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-green-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                  animation: 'progress 3s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 3000
        })
        setNewUser({ username: '', email: '', password: '', role: 'user' })
        setShowAddDialog(false)
        loadUsers()
      } else {
        const error = await response.json()
        toast.error("Failed to create user", {
          description: (
            <div>
              <div>{error.error || "Failed to add user"}</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                  animation: 'progress 3s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 3000
        })
      }
    } catch (error) {
      toast.error("Failed to create user", {
        description: (
          <div>
            <div>Failed to add user</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
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
        toast.success("User updated", {
          description: (
            <div>
              <div>User details updated successfully</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-green-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                  animation: 'progress 3s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 3000
        })
        setShowEditDialog(false)
        setEditingUser(null)
        loadUsers()
      } else {
        const error = await response.json()
        toast.error("Failed to update user", {
          description: (
            <div>
              <div>{error.error || "Failed to update user"}</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                  animation: 'progress 3s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 3000
        })
      }
    } catch (error) {
      toast.error("Failed to update user", {
        description: (
          <div>
            <div>Failed to update user</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        toast.success("User deleted", {
          description: (
            <div>
              <div>User deleted successfully</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-green-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                  animation: 'progress 3s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 3000
        })
        loadUsers()
      } else {
        const error = await response.json()
        toast.error("Failed to delete user", {
          description: (
            <div>
              <div>{error.error || "Failed to delete user"}</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                  animation: 'progress 3s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 3000
        })
      }
    } catch (error) {
      toast.error("Failed to delete user", {
        description: (
          <div>
            <div>Failed to delete user</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/users/${passwordUserId}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      })
      
      if (response.ok) {
        toast.success("Password updated", {
          description: (
            <div>
              <div>Password updated successfully</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-green-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                  animation: 'progress 3s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 3000
        })
        setShowPasswordDialog(false)
        setNewPassword('')
        setPasswordUserId('')
      } else {
        const error = await response.json()
        toast.error("Failed to update password", {
          description: (
            <div>
              <div>{error.error || "Failed to update password"}</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                  animation: 'progress 3s linear forwards'
                }}></div>
              </div>
            </div>
          ),
          duration: 3000
        })
      }
    } catch (error) {
      toast.error("Failed to update password", {
        description: (
          <div>
            <div>Failed to update password</div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div className="bg-red-500 h-1 rounded-full animate-[progress_3s_linear_forwards]" style={{
                animation: 'progress 3s linear forwards'
              }}></div>
            </div>
          </div>
        ),
        duration: 3000
      })
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
                          onClick={() => {
                            setPasswordUserId(user._id)
                            setShowPasswordDialog(true)
                          }}
                        >
                          <Key className="w-3 h-3" />
                        </Button>
                        {currentUserRole === 'developer' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 w-7 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>⚠️ Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{user.username}</strong>? This action cannot be undone and will permanently remove:
                                  <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>User account</li>
                                    <li>All time entries</li>
                                    <li>All active sessions</li>
                                    <li>All associated data</li>
                                  </ul>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
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

      {/* Update Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="New Password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdatePassword} className="flex-1">Update Password</Button>
              <Button variant="outline" onClick={() => {
                setShowPasswordDialog(false)
                setNewPassword('')
                setPasswordUserId('')
                setShowPassword(false)
              }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}