import { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Code2, Database, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DeveloperTools() {
  const [seeding, setSeeding] = useState(false)

  const handleSeedDatabase = async (numMembers: number) => {
    if (
      !confirm(
        `This will clear all existing data and create ${numMembers} test members. Are you sure?`
      )
    ) {
      return
    }

    setSeeding(true)
    try {
      const result = await window.api.seed.database({
        numMembers,
        numPlans: 10,
        checkInRate: 0.7,
        clearExisting: true
      })

      if (result.success) {
        toast.success(
          `Database seeded! Created ${result.stats?.members} members, ${result.stats?.memberships} memberships, ${result.stats?.checkIns} check-ins`
        )
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Failed to seed database:', error)
      toast.error('Failed to seed database')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Code2 className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-semibold text-white">Developer Tools</h2>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-300 font-medium mb-2">⚠️ Warning</p>
        <p className="text-xs text-yellow-200">
          These tools are for development and testing only. They will clear all existing data and
          populate the database with test data.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Seed Database</h3>
          <p className="text-sm text-gray-400 mb-4">
            Generate test data to test app scalability with various member scenarios (active,
            expired, expiring, inactive members).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => handleSeedDatabase(50)}
              disabled={seeding}
              className="gap-2"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Seed 50 Members
                </>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSeedDatabase(100)}
              disabled={seeding}
              className="gap-2"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Seed 100 Members
                </>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSeedDatabase(500)}
              disabled={seeding}
              className="gap-2"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Seed 500 Members
                </>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSeedDatabase(1000)}
              disabled={seeding}
              className="gap-2 bg-orange-600 hover:bg-orange-700"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Seed 1000 Members
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
