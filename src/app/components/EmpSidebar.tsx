import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface SidebarEmployee {
  _id: string;
  name: string;
}

export interface Sidebarrole {
  _id: string;
  name: string;
  employees: SidebarEmployee[];
}

interface Props {
  roles: Sidebarrole[];
  selectedEmployeeId?: string;
  onEmployeeSelect?: (id: string) => void;
}

export function EmployeeSidebar({
  roles,
  selectedEmployeeId,
  onEmployeeSelect,
}: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div className="w-72 bg-white border-r h-full flex flex-col shadow-sm">
      
      {/* HEADER */}
      <div className="p-4 font-semibold text-gray-800 border-b sticky top-0 bg-white z-10">
        Resources
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {roles.map((dept) => {
          const isOpen = open[dept._id];

          return (
            <div key={dept._id}>
              
              {/* role */}
              <button
                onClick={() =>
                  setOpen((prev) => ({
                    ...prev,
                    [dept._id]: !prev[dept._id],
                  }))
                }
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                {isOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}

                <span className="flex-1 text-left truncate">
                  {dept.name}
                </span>

                {/* COUNT BADGE */}
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  {dept.employees.length}
                </span>
              </button>

              {/* EMPLOYEES */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? "max-h-96 mt-1" : "max-h-0"
                }`}
              >
                <div className="space-y-1 pl-6">
                  {dept.employees.map((emp) => {
                    const isSelected =
                      selectedEmployeeId === emp._id;

                    return (
                      <button
                        key={emp._id}
                        onClick={() => onEmployeeSelect?.(emp._id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                          ${
                            isSelected
                              ? "bg-blue-50 text-blue-700 shadow-sm"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        {/* AVATAR */}
                        <div
                          className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-semibold
                          ${
                            isSelected
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {emp.name.charAt(0).toUpperCase()}
                        </div>

                        {/* NAME */}
                        <span className="truncate flex-1 text-left">
                          {emp.name}
                        </span>

                        {/* ACTIVE DOT */}
                        {isSelected && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}