/**
 * Usuwa wszystkie oferty, umowy, powiadomienia i follow-upy
 * z konta o podanym adresie e-mail.
 *
 * Uruchomienie:
 *   cd smartquote-backend
 *   npx tsx scripts/cleanup-test-account.ts
 *
 * Domyślny e-mail to testowy@test.pl — zmień EMAIL poniżej jeśli potrzebujesz.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const EMAIL = 'testowy@test.pl'

async function main() {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } })

    if (!user) {
        console.log(`❌ Użytkownik ${EMAIL} nie istnieje.`)
        return
    }

    console.log(`\n👤 Użytkownik: ${user.email} (id: ${user.id})`)
    console.log('─'.repeat(50))

    // Liczymy przed usunięciem
    const [offers, contracts, notifications, followUps] = await Promise.all([
        prisma.offer.count({ where: { userId: user.id } }),
        prisma.contract.count({ where: { userId: user.id } }),
        prisma.notification.count({ where: { userId: user.id } }),
        prisma.followUp.count({ where: { userId: user.id } }),
    ])

    console.log(`📄 Oferty:         ${offers}`)
    console.log(`📝 Umowy:          ${contracts}`)
    console.log(`🔔 Powiadomienia:  ${notifications}`)
    console.log(`📅 Follow-upy:     ${followUps}`)
    console.log('')

    if (offers + contracts + notifications + followUps === 0) {
        console.log('✅ Konto jest już puste — nic do usunięcia.')
        return
    }

    // Usuwamy (cascade usuwa automatycznie powiązane rekordy)
    const [delOffers, delContracts, delNotifications, delFollowUps] = await Promise.all([
        prisma.offer.deleteMany({ where: { userId: user.id } }),
        prisma.contract.deleteMany({ where: { userId: user.id } }),
        prisma.notification.deleteMany({ where: { userId: user.id } }),
        prisma.followUp.deleteMany({ where: { userId: user.id } }),
    ])

    console.log(`✅ Usunięto ofert:        ${delOffers.count}`)
    console.log(`✅ Usunięto umów:         ${delContracts.count}`)
    console.log(`✅ Usunięto powiadomień:  ${delNotifications.count}`)
    console.log(`✅ Usunięto follow-upów:  ${delFollowUps.count}`)
    console.log('\n🎉 Gotowe! Konto jest teraz puste (klienci i ustawienia zostają).')
}

main()
    .catch(e => {
        console.error('❌ Błąd:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
