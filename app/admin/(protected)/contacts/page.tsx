import { prisma } from '@/lib/prisma';

export default async function AdminContactsPage() {
  const contacts = await prisma.contactApplication.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Contact Submissions</h1>
        <p className="text-stone-500 text-sm mt-1">{contacts.length} submissions total</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="text-center py-16 text-stone-400">No contact submissions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-medium text-stone-500 uppercase tracking-wider bg-stone-50 border-b border-stone-100">
                  <th className="text-left px-6 py-3">Name</th>
                  <th className="text-left px-6 py-3">Phone</th>
                  <th className="text-left px-6 py-3">Message</th>
                  <th className="text-left px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-800">{c.name}</td>
                    <td className="px-6 py-4 text-stone-500">{c.phone}</td>
                    <td className="px-6 py-4 text-stone-500 max-w-xs truncate">{c.message ?? '—'}</td>
                    <td className="px-6 py-4 text-stone-400">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
