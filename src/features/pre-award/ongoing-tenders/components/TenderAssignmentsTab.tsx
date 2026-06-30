import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Archive, RefreshCcw, Search, X, Check } from 'lucide-react';
import { Tender, TenderAssignment, BusinessEvent } from '../types';
import { MasterDataRepository } from '../../../../repositories/MasterDataRepository';
import { AssignmentRepository } from '../../../../repositories/AssignmentRepository';
import { BusinessEventRepository } from '../../../../repositories/BusinessEventRepository';
import { Employee, Role, Department, BusinessUnit } from '../../../../domain/master/MasterData';
import { Clock } from '../../../../services/Clock';

interface TenderAssignmentsTabProps {
  selectedTender: Tender;
  isAr: boolean;
  lang: 'ar' | 'en';
  onUpdateTender?: (updated: Tender) => void;
  onShowAlert: (msg: string) => void;
  readOnly?: boolean;
}

export function TenderAssignmentsTab({
  selectedTender,
  isAr,
  lang,
  onUpdateTender,
  onShowAlert,
  readOnly = false,
}: TenderAssignmentsTabProps) {
  const assignmentRepo = useMemo(() => new AssignmentRepository(), []);
  const eventRepo = useMemo(() => new BusinessEventRepository(), []);
  const masterRepo = useMemo(() => new MasterDataRepository(), []);

  // Registry states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);

  // List state
  const [assignments, setAssignments] = useState<TenderAssignment[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('Active'); // Default to Active only
  const [sortBy, setSortBy] = useState<string>('assignedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal / Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TenderAssignment | null>(null);

  // Form inputs
  const [formRoleId, setFormRoleId] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formAssignedDate, setFormAssignedDate] = useState(Clock.todayISO());
  const [formEffectiveFrom, setFormEffectiveFrom] = useState(Clock.todayISO());
  const [formEffectiveTo, setFormEffectiveTo] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Load Master Data and Assignments
  const loadData = () => {
    Promise.all([
      masterRepo.getRegister<Employee>('master_employees'),
      masterRepo.getRegister<Role>('master_roles'),
      masterRepo.getDepartments(),
      masterRepo.getRegister<BusinessUnit>('master_businessunits'),
      assignmentRepo.getByTenderId(selectedTender.id),
    ]).then(([empList, roleList, deptList, buList, assignList]) => {
      setEmployees(empList);
      setRoles(roleList);
      setDepartments(deptList);
      setBusinessUnits(buList);
      setAssignments(assignList);
    });
  };

  useEffect(() => {
    loadData();
  }, [selectedTender.id]);

  // Lookup helpers
  const getRoleDisplayName = (roleId: string) => {
    const r = roles.find(x => x.id === roleId);
    if (!r) return roleId;
    return isAr ? r.nameAr : r.nameEn;
  };

  const getEmployeeDisplayName = (empId: string) => {
    const e = employees.find(x => x.id === empId);
    if (!e) return empId;
    return isAr ? e.nameAr : e.nameEn;
  };

  const getEmployeeDeptName = (empId: string) => {
    const e = employees.find(x => x.id === empId);
    if (!e) return 'N/A';
    const dept = departments.find(d => d.id === e.departmentId);
    return dept ? (isAr ? dept.nameAr || dept.name : dept.name) : 'N/A';
  };

  const getEmployeeBUName = (empId: string) => {
    const e = employees.find(x => x.id === empId);
    if (!e) return 'N/A';
    const bu = businessUnits.find(b => b.id === e.businessUnitId);
    return bu ? (isAr ? bu.nameAr || bu.name : bu.name) : 'N/A';
  };

  // Log Business Event helper
  const logBusinessEvent = async (
    action: string,
    entityId: string,
    remarks: string,
    oldValue?: string,
    newValue?: string,
    changedFields?: string[]
  ) => {
    const event: BusinessEvent = {
      eventId: `event-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tenderId: selectedTender.id,
      timestamp: new Date().toISOString(),
      userId: lang === 'en' ? 'Ahmed Mostafa' : 'أحمد مصطفى',
      source: 'User',
      moduleId: 'Assignments',
      entityType: 'TenderAssignment',
      entityId,
      action,
      changedFields,
      oldValue,
      newValue,
      remarks,
    };
    await eventRepo.logEvent(event);

    // Trigger update of selectedTender in the parent so History tab refreshes
    if (onUpdateTender) {
      // Fetch latest events and update tender state
      const allEvents = await eventRepo.getByTenderId(selectedTender.id);
      const allAssignments = await assignmentRepo.getByTenderId(selectedTender.id);
      onUpdateTender({
        ...selectedTender,
        assignments: allAssignments,
        businessEvents: allEvents,
      });
    }
  };

  // Open Form modal for Add
  const handleOpenAdd = () => {
    if (readOnly) {
      onShowAlert(isAr ? 'لا يمكن تعديل مناقصة تمت ترسيتها.' : 'Awarded tenders are read-only.');
      return;
    }
    setEditingAssignment(null);
    setFormRoleId(roles[0]?.id || '');
    setFormEmployeeId(employees[0]?.id || '');
    setFormAssignedDate(Clock.todayISO());
    setFormEffectiveFrom(Clock.todayISO());
    setFormEffectiveTo('');
    setFormNotes('');
    setShowFormModal(true);
  };

  // Open Form modal for Edit
  const handleOpenEdit = (asg: TenderAssignment) => {
    if (readOnly) {
      onShowAlert(isAr ? 'لا يمكن تعديل مناقصة تمت ترسيتها.' : 'Awarded tenders are read-only.');
      return;
    }
    setEditingAssignment(asg);
    setFormRoleId(asg.roleId);
    setFormEmployeeId(asg.employeeId);
    setFormAssignedDate(asg.assignedDate);
    setFormEffectiveFrom(asg.effectiveFrom);
    setFormEffectiveTo(asg.effectiveTo || '');
    setFormNotes(asg.notes || '');
    setShowFormModal(true);
  };

  // Save Assignment (Create or Update)
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (readOnly) {
      onShowAlert(isAr ? 'لا يمكن تعديل مناقصة تمت ترسيتها.' : 'Awarded tenders are read-only.');
      setShowFormModal(false);
      return;
    }

    if (!formRoleId || !formEmployeeId) {
      onShowAlert(isAr ? 'الرجاء اختيار الدور والموظف.' : 'Please select Role and Employee.');
      return;
    }

    const today = new Date().toISOString();
    const currentUser = lang === 'en' ? 'Ahmed Mostafa' : 'أحمد مصطفى';

    if (editingAssignment) {
      // Edit mode
      const updated: TenderAssignment = {
        ...editingAssignment,
        roleId: formRoleId,
        employeeId: formEmployeeId,
        assignedDate: formAssignedDate,
        effectiveFrom: formEffectiveFrom,
        effectiveTo: formEffectiveTo || null,
        notes: formNotes,
        modifiedAt: today,
        modifiedBy: currentUser,
      };

      const success = await assignmentRepo.save(updated);
      if (success) {
        const empName = getEmployeeDisplayName(formEmployeeId);
        const roleName = getRoleDisplayName(formRoleId);
        await logBusinessEvent(
          'Assignment Updated',
          updated.assignmentId,
          isAr
            ? `تعديل تكليف ${roleName} للموظف ${empName}`
            : `Updated assignment for ${roleName} to ${empName}`,
          editingAssignment.employeeId !== formEmployeeId ? `Prev Employee: ${editingAssignment.employeeId}` : undefined,
          `New Employee: ${formEmployeeId}`,
          ['employeeId', 'roleId', 'effectiveTo', 'notes']
        );
        onShowAlert(isAr ? 'تم حفظ التعديلات بنجاح.' : 'Assignment updated successfully.');
      }
    } else {
      // Add mode
      const newAsg: TenderAssignment = {
        assignmentId: `asg-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        tenderId: selectedTender.id,
        roleId: formRoleId,
        employeeId: formEmployeeId,
        status: 'Active',
        assignedDate: formAssignedDate,
        effectiveFrom: formEffectiveFrom,
        effectiveTo: formEffectiveTo || null,
        notes: formNotes,
        createdAt: today,
        createdBy: currentUser,
        modifiedAt: today,
        modifiedBy: currentUser,
        archivedAt: null,
        archivedBy: null,
        recordStatus: 'Active',
      };

      const success = await assignmentRepo.save(newAsg);
      if (success) {
        const empName = getEmployeeDisplayName(formEmployeeId);
        const roleName = getRoleDisplayName(formRoleId);
        await logBusinessEvent(
          'Assignment Added',
          newAsg.assignmentId,
          isAr
            ? `إضافة تكليف ${roleName} للموظف ${empName}`
            : `Assigned ${roleName} to ${empName}`,
          undefined,
          `Employee: ${formEmployeeId}, Role: ${formRoleId}`
        );
        onShowAlert(isAr ? 'تمت إضافة التكليف بنجاح.' : 'Assignment added successfully.');
      }
    }

    setShowFormModal(false);
    loadData();
  };

  // Archive Assignment
  const handleArchive = async (asg: TenderAssignment) => {
    if (readOnly) {
      onShowAlert(isAr ? 'لا يمكن تعديل مناقصة تمت ترسيتها.' : 'Awarded tenders are read-only.');
      return;
    }
    const today = new Date().toISOString();
    const currentUser = lang === 'en' ? 'Ahmed Mostafa' : 'أحمد مصطفى';

    const updated: TenderAssignment = {
      ...asg,
      status: 'Archived',
      recordStatus: 'Archived',
      archivedAt: today,
      archivedBy: currentUser,
      modifiedAt: today,
      modifiedBy: currentUser,
    };

    const success = await assignmentRepo.save(updated);
    if (success) {
      const empName = getEmployeeDisplayName(asg.employeeId);
      const roleName = getRoleDisplayName(asg.roleId);
      await logBusinessEvent(
        'Assignment Archived',
        asg.assignmentId,
        isAr
          ? `أرشفة تكليف ${roleName} للموظف ${empName}`
          : `Archived assignment for ${roleName} to ${empName}`
      );
      onShowAlert(isAr ? 'تمت أرشفة التكليف بنجاح.' : 'Assignment archived successfully.');
      loadData();
    }
  };

  // Restore Assignment
  const handleRestore = async (asg: TenderAssignment) => {
    if (readOnly) {
      onShowAlert(isAr ? 'لا يمكن تعديل مناقصة تمت ترسيتها.' : 'Awarded tenders are read-only.');
      return;
    }
    const today = new Date().toISOString();
    const currentUser = lang === 'en' ? 'Ahmed Mostafa' : 'أحمد مصطفى';

    const updated: TenderAssignment = {
      ...asg,
      status: 'Active',
      recordStatus: 'Active',
      archivedAt: null,
      archivedBy: null,
      modifiedAt: today,
      modifiedBy: currentUser,
    };

    const success = await assignmentRepo.save(updated);
    if (success) {
      const empName = getEmployeeDisplayName(asg.employeeId);
      const roleName = getRoleDisplayName(asg.roleId);
      await logBusinessEvent(
        'Assignment Restored',
        asg.assignmentId,
        isAr
          ? `استعادة تكليف ${roleName} للموظف ${empName}`
          : `Restored assignment for ${roleName} to ${empName}`
      );
      onShowAlert(isAr ? 'تمت استعادة التكليف بنجاح.' : 'Assignment restored successfully.');
      loadData();
    }
  };

  // Sort and Filter logic
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(order => (order === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAssignments = useMemo(() => {
    let result = [...assignments];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(a => a.roleId === roleFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => {
        const roleName = getRoleDisplayName(a.roleId).toLowerCase();
        const empName = getEmployeeDisplayName(a.employeeId).toLowerCase();
        const deptName = getEmployeeDeptName(a.employeeId).toLowerCase();
        const buName = getEmployeeBUName(a.employeeId).toLowerCase();
        const notes = (a.notes || '').toLowerCase();

        return (
          roleName.includes(query) ||
          empName.includes(query) ||
          deptName.includes(query) ||
          buName.includes(query) ||
          notes.includes(query)
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortBy as keyof TenderAssignment] || '';
      let valB: any = b[sortBy as keyof TenderAssignment] || '';

      if (sortBy === 'role') {
        valA = getRoleDisplayName(a.roleId);
        valB = getRoleDisplayName(b.roleId);
      } else if (sortBy === 'employee') {
        valA = getEmployeeDisplayName(a.employeeId);
        valB = getEmployeeDisplayName(b.employeeId);
      } else if (sortBy === 'department') {
        valA = getEmployeeDeptName(a.employeeId);
        valB = getEmployeeDeptName(b.employeeId);
      } else if (sortBy === 'businessUnit') {
        valA = getEmployeeBUName(a.employeeId);
        valB = getEmployeeBUName(b.employeeId);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [assignments, searchQuery, roleFilter, statusFilter, sortBy, sortOrder, roles, employees, departments, businessUnits]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200 text-sans">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث في التكليفات...' : 'Search assignments...'}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-brand-navy"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
          >
            <option value="all">{isAr ? 'الحالة: الكل' : 'All Statuses'}</option>
            <option value="Active">{isAr ? 'نشط' : 'Active'}</option>
            <option value="Archived">{isAr ? 'مؤرشف' : 'Archived'}</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
          >
            <option value="all">{isAr ? 'الدور: الكل' : 'All Roles'}</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>
                {isAr ? r.nameAr : r.nameEn}
              </option>
            ))}
          </select>

          {/* Add Assignment Trigger Button */}
          <button
            onClick={handleOpenAdd}
            disabled={readOnly}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة تكليف' : 'Add Assignment'}</span>
          </button>
        </div>
      </div>

      {/* Transactional Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-150 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <tr>
                <th onClick={() => handleSort('role')} className="p-3 cursor-pointer hover:bg-slate-100 select-none">
                  {isAr ? 'الدور الوظيفي' : 'Role'}
                </th>
                <th onClick={() => handleSort('employee')} className="p-3 cursor-pointer hover:bg-slate-100 select-none">
                  {isAr ? 'الموظف المسؤول' : 'Assigned Employee'}
                </th>
                <th onClick={() => handleSort('department')} className="p-3 cursor-pointer hover:bg-slate-100 select-none">
                  {isAr ? 'القسم' : 'Department'}
                </th>
                <th onClick={() => handleSort('businessUnit')} className="p-3 cursor-pointer hover:bg-slate-100 select-none">
                  {isAr ? 'وحدة العمل' : 'Business Unit'}
                </th>
                <th onClick={() => handleSort('assignedDate')} className="p-3 cursor-pointer hover:bg-slate-100 select-none">
                  {isAr ? 'تاريخ التعيين' : 'Assigned Date'}
                </th>
                <th onClick={() => handleSort('effectiveFrom')} className="p-3 cursor-pointer hover:bg-slate-100 select-none">
                  {isAr ? 'ساري من' : 'Effective From'}
                </th>
                <th onClick={() => handleSort('effectiveTo')} className="p-3 cursor-pointer hover:bg-slate-100 select-none">
                  {isAr ? 'ساري حتى' : 'Effective To'}
                </th>
                <th className="p-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3 text-center">{isAr ? 'العمليات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    {isAr ? 'لا توجد تكليفات بعد' : 'No Assignments Yet'}
                  </td>
                </tr>
              ) : (
                filteredAssignments.map(asg => {
                  const isActive = asg.status === 'Active';
                  return (
                    <tr key={asg.assignmentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-extrabold text-brand-navy">{getRoleDisplayName(asg.roleId)}</td>
                      <td className="p-3 text-slate-800">{getEmployeeDisplayName(asg.employeeId)}</td>
                      <td className="p-3 text-slate-550">{getEmployeeDeptName(asg.employeeId)}</td>
                      <td className="p-3 text-slate-550">{getEmployeeBUName(asg.employeeId)}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{asg.assignedDate}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{asg.effectiveFrom}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{asg.effectiveTo || '-'}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {isAr ? (isActive ? 'نشط' : 'مؤرشف') : asg.status}
                        </span>
                      </td>
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Action */}
                          {isActive && (
                            <button
                              onClick={() => handleOpenEdit(asg)}
                              className="p-1.5 hover:bg-slate-150 rounded-lg text-slate-500 hover:text-brand-navy transition-all cursor-pointer"
                              title={isAr ? 'تعديل التكليف' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Archive/Restore Action */}
                          {isActive ? (
                            <button
                              onClick={() => handleArchive(asg)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-brand-red transition-all cursor-pointer"
                              title={isAr ? 'أرشفة التكليف' : 'Archive'}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(asg)}
                              className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                              title={isAr ? 'استعادة التكليف' : 'Restore'}
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline/Modal Form Dialog */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-[15px] text-brand-navy">
                {editingAssignment
                  ? (isAr ? 'تعديل تفاصيل التكليف' : 'Edit Assignment Details')
                  : (isAr ? 'إسناد تكليف وظيفي جديد' : 'Assign New Role')}
              </h4>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-450 block">{isAr ? 'الدور الوظيفي *' : 'Role *'}</label>
                <select
                  value={formRoleId}
                  onChange={e => setFormRoleId(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  required
                >
                  <option value="" disabled>{isAr ? 'اختر الدور...' : 'Select Role...'}</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {isAr ? r.nameAr : r.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-450 block">{isAr ? 'الموظف المسؤول *' : 'Employee *'}</label>
                <select
                  value={formEmployeeId}
                  onChange={e => setFormEmployeeId(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  required
                >
                  <option value="" disabled>{isAr ? 'اختر الموظف...' : 'Select Employee...'}</option>
                  {employees.map(emp => {
                    const deptName = getEmployeeDeptName(emp.id);
                    const buName = getEmployeeBUName(emp.id);
                    return (
                      <option key={emp.id} value={emp.id}>
                        {isAr ? emp.nameAr : emp.nameEn} ({deptName} - {buName})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">{isAr ? 'ساري من' : 'Effective From'}</label>
                  <input
                    type="date"
                    value={formEffectiveFrom}
                    onChange={e => setFormEffectiveFrom(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">{isAr ? 'ساري حتى (اختياري)' : 'Effective To (Opt)'}</label>
                  <input
                    type="date"
                    value={formEffectiveTo}
                    onChange={e => setFormEffectiveTo(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 block">{isAr ? 'ملاحظات إضافية' : 'Notes / Remarks'}</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder={isAr ? 'اكتب تفاصيل التكليف...' : 'Enter assignment remarks...'}
                  rows={2}
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-navy hover:bg-brand-navy/90 text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  {isAr ? 'حفظ وإسناد' : 'Save & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
