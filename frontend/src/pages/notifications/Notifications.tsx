import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, MoreVertical } from 'lucide-react';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from '../../hooks/notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

type FilterType = 'all' | 'unread' | 'read';

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showActions, setShowActions] = useState<number | null>(null);

  const { data: notifications, isLoading } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const filteredNotifications = notifications?.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  }) || [];

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: number) => {
    deleteNotificationMutation.mutate(id);
    setShowActions(null);
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredNotifications.map(n => n.id));
    setSelectedIds(allIds);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => {
      deleteNotificationMutation.mutate(id);
    });
    setSelectedIds(new Set());
  };

  const handleBulkMarkAsRead = () => {
    selectedIds.forEach(id => {
      const notification = notifications?.find(n => n.id === id);
      if (notification && !notification.is_read) {
        markAsReadMutation.mutate(id);
      }
    });
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-8 h-8" />
            Notificaciones
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>
        <p className="text-gray-600">
          {unreadCount > 0 
            ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
            : 'No tienes notificaciones sin leer'}
        </p>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="bg-white rounded-lg border mb-6 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todas ({notifications?.length || 0})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                No leídas ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === 'read'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Leídas ({(notifications?.length || 0) - unreadCount})
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
              </span>
              <button
                onClick={handleBulkMarkAsRead}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Marcar como leídas
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Select All */}
          {filteredNotifications.length > 0 && selectedIds.size === 0 && (
            <button
              onClick={selectAll}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Seleccionar todas
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg transition-all duration-150 ${
                !notification.is_read 
                  ? 'border-l-4 border-l-blue-500 border-y border-r border-gray-200 shadow-sm' 
                  : 'border border-gray-200'
              } ${
                selectedIds.has(notification.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(notification.id)}
                    onChange={() => toggleSelect(notification.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className={`text-sm leading-relaxed ${
                        !notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      
                      {/* Actions Menu */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setShowActions(showActions === notification.id ? null : notification.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {showActions === notification.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                            {!notification.is_read && (
                              <button
                                onClick={() => {
                                  handleMarkAsRead(notification.id);
                                  setShowActions(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Check className="w-4 h-4" />
                                Marcar como leída
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp and Status */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(notification.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </span>
                      {notification.is_read && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCheck className="w-3 h-3" />
                            Leída
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'unread' && 'No tienes notificaciones sin leer'}
              {filter === 'read' && 'No tienes notificaciones leídas'}
              {filter === 'all' && 'No tienes notificaciones'}
            </h3>
            <p className="text-sm text-gray-500">
              {filter === 'all' 
                ? 'Te avisaremos cuando haya algo nuevo'
                : 'Cambia el filtro para ver otras notificaciones'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;