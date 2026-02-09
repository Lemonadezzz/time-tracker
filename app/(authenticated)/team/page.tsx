"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Clock, Plus, Edit, Trash2, UserPlus, Key, Eye, EyeOff, Building2 } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { Label } from "@/components/ui/label"

interface User {
  _id: string
  username: string
  email: string
  role: 'admin' | 'user' | 'developer'
  departmentId?: string
  createdAt: string
}

interface Department {
  _id: string
  name: string
  description?: string
  createdAt: string
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDeptDialog, setShowAddDeptDialog] = useState(false)
  const [showEditDeptDialog, setShowEditDeptDialog] = useState(false)
  const [showAddUsersToDeptDialog, setShowAddUsersToDeptDialog] = useState(false)
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' as const, departmentId: '' })
  const [newDept, setNewDept] = useState({ name: '', description: '' })
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordUserId, setPasswordUserId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('userRole') || ''
    setCurrentUserRole(role)
  }, [])

  useEffect(() => {
    loadUsers()
    loadDepartments()
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

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setDepartments(data.departments || [])
    } catch (error) {
      console.error('Failed to load departments:', error)
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
        toast.success("User created successfully")
        setNewUser({ username: '', email: '', password: '', role: 'user', departmentId: '' })
        setShowAddDialog(false)
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add user")
      }
    } catch (error) {
      toast.error("Failed to add user")
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
          role: editingUser.role,
          departmentId: editingUser.departmentId || null
        })
      })
      
      if (response.ok) {
        toast.success("User updated successfully")
        setShowEditDialog(false)
        setEditingUser(null)
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update user")
      }
    } catch (error) {
      toast.error("Failed to update user")
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
        toast.success("User deleted successfully")
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete user")
      }
    } catch (error) {
      toast.error("Failed to delete user")
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
        toast.success("Password updated successfully")
        setShowPasswordDialog(false)
        setNewPassword('')
        setPasswordUserId('')
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update password")
      }
    } catch (error) {
      toast.error("Failed to update password")
    }
  }

  const handleAddDept = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDept)
      })
      
      if (response.ok) {
        toast.success("Department created successfully")
        setNewDept({ name: '', description: '' })
        setShowAddDeptDialog(false)
        loadDepartments()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add department")
      }
    } catch (error) {
      toast.error("Failed to add department")
    }
  }

  const handleEditDept = async () => {
    if (!editingDept) return
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/departments/${editingDept._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingDept.name,
          description: editingDept.description
        })
      })
      
      if (response.ok) {
        toast.success("Department updated successfully")
        setShowEditDeptDialog(false)
        setEditingDept(null)
        loadDepartments()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update department")
      }
    } catch (error) {
      toast.error("Failed to update department")
    }
  }

  const handleDeleteDept = async (deptId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/departments/${deptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        toast.success("Department deleted successfully")
        loadDepartments()
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete department")
      }
    } catch (error) {
      toast.error("Failed to delete department")
    }
  }

  const handleAddUsersToDept = async () => {
    if (!selectedDeptId || selectedUserIds.length === 0) return
    
    try {
      const token = localStorage.getItem('authToken')
      const promises = selectedUserIds.map(userId => 
        fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            departmentId: selectedDeptId
          })
        })
      )
      
      await Promise.all(promises)
      toast.success(`Added ${selectedUserIds.length} user(s) to department`)
      setShowAddUsersToDeptDialog(false)
      setSelectedUserIds([])
      setSelectedDeptId('')
      loadUsers()
    } catch (error) {
      toast.error("Failed to add users to department")
    }
  }

  const getAvailableUsers = () => {
    return users.filter(u => !u.departmentId)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'developer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getDeptName = (deptId?: string) => {
    if (!deptId) return 'No Department'
    const dept = departments.find(d => d._id === deptId)
    return dept?.name || 'Unknown'
  }

  const getUsersByDept = (deptId: string) => {
    return users.filter(u => u.departmentId === deptId).length
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-6 md:pt-6">
      <div className="max-w-6xl md:mx-auto space-y-3 md:space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 md:w-6 md:h-6" />
          <h1 className="text-xl md:text-2xl font-bold">Users & Departments</h1>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-end">
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
                    <div>
                      <Label>Username</Label>
                      <Input
                        placeholder="Username"
                        value={newUser.username}
                        onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input
                        placeholder="Password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
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
                    </div>
                    <div>
                      <Label>Department</Label>
                      <Select value={newUser.departmentId || 'none'} onValueChange={(value) => setNewUser(prev => ({ ...prev, departmentId: value === 'none' ? '' : value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Department</SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                  <Badge variant="secondary">{users.length} members</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p>Loading...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="h-[calc(100vh-400px)] overflow-y-auto">
                    <div className="space-y-1">
                      {users.map((user) => (
                        <div key={user._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{user.username}</p>
                              <Badge className={`text-xs px-1.5 py-0.5 ${getRoleBadgeColor(user.role)}`}>
                                {user.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            <p className="text-xs text-muted-foreground">{getDeptName(user.departmentId)}</p>
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
                                  <Button variant="destructive" size="sm" className="h-7 w-7 p-0">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {user.username}? This will remove all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user._id)} className="bg-red-600 hover:bg-red-700">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showAddDeptDialog} onOpenChange={setShowAddDeptDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Department</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Department Name</Label>
                      <Input
                        placeholder="Department name"
                        value={newDept.name}
                        onChange={(e) => setNewDept(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        placeholder="Description (optional)"
                        value={newDept.description}
                        onChange={(e) => setNewDept(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddDept} className="flex-1">Add Department</Button>
                      <Button variant="outline" onClick={() => setShowAddDeptDialog(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-base md:text-xl">Departments</span>
                  </div>
                  <Badge variant="secondary">{departments.length} departments</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                {departments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No departments found</p>
                  </div>
                ) : (
                  <div className="h-[calc(100vh-400px)] overflow-y-auto">
                    <div className="space-y-1">
                      {departments.map((dept) => (
                        <div key={dept._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{dept.name}</p>
                              <Badge variant="outline" className="text-xs">{getUsersByDept(dept._id)} users</Badge>
                            </div>
                            {dept.description && (
                              <p className="text-xs text-muted-foreground">{dept.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => {
                                setSelectedDeptId(dept._id)
                                setShowAddUsersToDeptDialog(true)
                              }}
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              <span className="text-xs">Add Users</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setEditingDept(dept)
                                setShowEditDeptDialog(true)
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="h-7 w-7 p-0">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {dept.name}? Users in this department will be unassigned.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteDept(dept._id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input
                  placeholder="Username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, username: e.target.value } : null)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  placeholder="Email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div>
                <Label>Role</Label>
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
              </div>
              <div>
                <Label>Department</Label>
                <Select value={editingUser.departmentId || 'none'} onValueChange={(value) => setEditingUser(prev => prev ? { ...prev, departmentId: value === 'none' ? undefined : value } : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditUser} className="flex-1">Update User</Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={showEditDeptDialog} onOpenChange={setShowEditDeptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          {editingDept && (
            <div className="space-y-4">
              <div>
                <Label>Department Name</Label>
                <Input
                  placeholder="Department name"
                  value={editingDept.name}
                  onChange={(e) => setEditingDept(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Description (optional)"
                  value={editingDept.description || ''}
                  onChange={(e) => setEditingDept(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditDept} className="flex-1">Update Department</Button>
                <Button variant="outline" onClick={() => setShowEditDeptDialog(false)}>Cancel</Button>
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
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

      {/* Add Users to Department Dialog */}
      <Dialog open={showAddUsersToDeptDialog} onOpenChange={(open) => {
        setShowAddUsersToDeptDialog(open)
        if (!open) {
          setSelectedUserIds([])
          setSelectedDeptId('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Users to {departments.find(d => d._id === selectedDeptId)?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Users</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !selectedUserIds.includes(value)) {
                    setSelectedUserIds(prev => [...prev, value])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select users to add" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableUsers()
                    .filter(u => !selectedUserIds.includes(u._id))
                    .map(user => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedUserIds.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Users ({selectedUserIds.length})</Label>
                <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto space-y-1">
                  {selectedUserIds.map(userId => {
                    const user = users.find(u => u._id === userId)
                    return user ? (
                      <div key={userId} className="flex items-center justify-between p-2 bg-accent rounded text-sm">
                        <span>{user.username}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setSelectedUserIds(prev => prev.filter(id => id !== userId))}
                        >
                          ×
                        </Button>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAddUsersToDept} 
                className="flex-1"
                disabled={selectedUserIds.length === 0}
              >
                Add {selectedUserIds.length > 0 ? `${selectedUserIds.length} ` : ''}User(s)
              </Button>
              <Button variant="outline" onClick={() => setShowAddUsersToDeptDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
