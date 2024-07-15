import axios from 'axios'
import dayjs from 'dayjs'
import { router } from 'expo-router'
import {
  ArrowRight,
  AtSign,
  Calendar as IconCalendar,
  MapPin,
  Settings2,
  UserRoundPlus,
} from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Image, Keyboard, Text, View } from 'react-native'
import type { DateData } from 'react-native-calendars'

import { Button } from '@/components/button'
import { Calendar } from '@/components/calendar'
import { GuestEmail } from '@/components/email'
import { Input } from '@/components/input'
import { Modal } from '@/components/modal'
import { tripServer } from '@/server/trip-server'
import { tripStorage } from '@/storage/trip'
import { colors } from '@/styles/colors'
import { calendarUtils, type DatesSelected } from '@/utils/calendarUtils'
import { validateInput } from '@/utils/validateInput'

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAIL = 2,
}

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  GUESTS = 2,
}

export default function Index() {
  // LOADING
  const [isCreatingTrip, setIsCreatingTrip] = useState(false)
  // DATA
  const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS)
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected)
  const [destination, setDestination] = useState('')
  const [emailToInvite, setEmailToInvite] = useState('')
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([])

  // MODAL
  const [showModal, setShowModal] = useState(MODAL.NONE)

  function handleNextStepForm() {
    if (
      destination.trim().length === 0 ||
      !selectedDates.startsAt ||
      !selectedDates.endsAt
    ) {
      return Alert.alert(
        'Detalhes da viagem',
        'Preencha todas as informações da viagem para seguir!',
      )
    }

    if (destination.length < 4) {
      return Alert.alert(
        'Detalhes da viagem',
        'O destino deve ter pelo menos 4 caracteres!',
      )
    }

    if (stepForm === StepForm.TRIP_DETAILS) {
      return setStepForm(StepForm.ADD_EMAIL)
    }

    Alert.alert('Nova viagem', 'Confirmar viagem?', [
      {
        text: 'Sim',
        style: 'default',
        onPress: createTrip,
      },
      {
        text: 'Cancelar',
        style: 'cancel',
      },
    ])
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    })

    setSelectedDates(dates)
  }

  function handleRemoveEmail(emailToRemove: string) {
    setEmailsToInvite((prevState) =>
      prevState.filter((email) => email !== emailToRemove),
    )
  }

  function handleAddEmail() {
    if (!validateInput.email(emailToInvite)) {
      return Alert.alert('Convidado', 'E-mail inválido!')
    }

    const emailAlreadyExists = emailsToInvite.find(
      (email) => email === emailToInvite,
    )

    if (emailAlreadyExists) {
      return Alert.alert('Convidado', 'E-mail já foi adicionado!')
    }

    setEmailsToInvite((prevState) => [...prevState, emailToInvite])
    setEmailToInvite('')
  }

  async function saveTrip(tripId: string) {
    try {
      await tripStorage.save(tripId)
      router.navigate(`/trip/${tripId}`)
    } catch (error) {
      console.log(error)
      Alert.alert(
        'Salvar viagem',
        'Não foi possivel salvar o id da viagem no dispositivo',
      )
    }
  }

  async function createTrip() {
    try {
      setIsCreatingTrip(true)

      const newTrip = await tripServer.create({
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toISOString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toISOString(),
        emails_to_invite: emailsToInvite,
      })

      Alert.alert('Nova viagem', 'Viagem criada com sucesso!', [
        {
          text: 'OK. Continuar.',
          onPress: () => saveTrip(newTrip?.tripId ?? ''),
        },
      ])
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(
          'Dados da resposta:',
          error.response ? error.response.data : null,
        )

        console.log(
          'Cabeçalhos da resposta:',
          error.response ? error.response.headers : null,
        )
      } else {
        console.log('Erro não relacionado ao Axios:', error)
      }

      setIsCreatingTrip(false)
      Alert.alert(
        'Salvar viagem',
        'Não foi possivel salvar o id da viagem no dispositivo',
      )
    }
  }

  return (
    <View className="flex-1 items-center justify-center px-5">
      <Image
        source={require('@/assets/logo.png')}
        alt="Logo"
        className="h-8"
        resizeMode="contain"
      />
      <Image
        source={require('@/assets/bg.png')}
        alt="Bg"
        className="absolute"
      />
      <Text className="mt-3 text-center font-regular text-lg text-zinc-400">
        Convide seus amigos e planeje sua {'\n'} próxima viagem
      </Text>

      <View className="my-8 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <Input variant="primary">
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Para onde?"
            editable={stepForm === StepForm.TRIP_DETAILS}
            onChangeText={setDestination}
            value={destination}
          />
        </Input>
        <Input variant="primary">
          <IconCalendar color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Quando?"
            editable={stepForm === StepForm.TRIP_DETAILS}
            onFocus={() => Keyboard.dismiss()}
            showSoftInputOnFocus={false}
            onPressIn={() =>
              stepForm === StepForm.TRIP_DETAILS && setShowModal(MODAL.CALENDAR)
            }
            value={selectedDates.formatDatesInText}
          />
        </Input>

        {stepForm === StepForm.ADD_EMAIL && (
          <View>
            <View className="border-b border-zinc-800 py-3">
              <Button
                onPress={() => setStepForm(StepForm.TRIP_DETAILS)}
                variant="secondary"
                isLoading={false}
              >
                <Button.Title>Alterar local/data</Button.Title>
                <Settings2 color={colors.zinc[200]} size={20} />
              </Button>
            </View>
            <Input variant="primary">
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <Input.Field
                showSoftInputOnFocus={false}
                onPressIn={() => {
                  Keyboard.dismiss()
                  stepForm === StepForm.ADD_EMAIL && setShowModal(MODAL.GUESTS)
                }}
                placeholder="Quem estará na viagem?"
                autoCorrect={false}
                value={
                  emailsToInvite.length > 0
                    ? `${emailsToInvite.length} pessoas convidadas`
                    : ''
                }
              />
            </Input>
          </View>
        )}

        <Button
          onPress={handleNextStepForm}
          variant="primary"
          isLoading={isCreatingTrip}
        >
          <Button.Title>
            {stepForm === StepForm.TRIP_DETAILS
              ? 'Continuar'
              : 'Confirmar Viagem'}
          </Button.Title>
          <ArrowRight color={colors.lime[950]} size={20} />
        </Button>
      </View>

      <Text className="text-center font-regular text-base text-zinc-500">
        Ao planejar sua viagem pela planne.er você automaticamente concorda com
        nossos{' '}
        <Text className="text-zinc-300 underline">
          termos de uso e políticas de privacidade.
        </Text>
      </Text>

      <Modal
        title="Selecionar datas"
        subtitle="Selecione a data de ida e volta da viagem"
        visible={showModal === MODAL.CALENDAR}
        onClose={() => {
          setShowModal(MODAL.NONE)
        }}
      >
        <View className="mt-4 gap-4">
          <Calendar
            minDate={dayjs().toISOString()}
            onDayPress={handleSelectDate}
            markedDates={selectedDates.dates}
          />
          <Button
            onPress={() => setShowModal(MODAL.NONE)}
            variant="secondary"
            isLoading={false}
          >
            <Button.Title>Confirmar</Button.Title>
            <ArrowRight color={colors.zinc[950]} size={20} />
          </Button>
        </View>
      </Modal>
      <Modal
        title="Selecionar convidados"
        subtitle="Os convidados irão receber e-mails para confirmar a participação na viagem"
        visible={showModal === MODAL.GUESTS}
        onClose={() => {
          setShowModal(MODAL.NONE)
        }}
      >
        <View className="my-2 flex-wrap items-start gap-2 border-b border-zinc-800 py-5">
          {emailsToInvite.length > 0 ? (
            emailsToInvite.map((email) => (
              <GuestEmail
                key={email}
                email={email}
                onRemove={() => handleRemoveEmail(email)}
              />
            ))
          ) : (
            <Text className="font-regular text-base text-zinc-600">
              Nenhum e-mail adicionado
            </Text>
          )}
        </View>
        <View className="mt-4 gap-4">
          <Input variant="secondary">
            <AtSign color={colors.zinc[400]} size={20} />
            <Input.Field
              onChangeText={(text) => setEmailToInvite(text.toLowerCase())}
              value={emailToInvite}
              placeholder="Digite o e-mail"
              keyboardType="email-address"
              returnKeyType="send"
              onSubmitEditing={handleAddEmail}
            />
          </Input>
          <Button onPress={handleAddEmail} variant="primary" isLoading={false}>
            <Button.Title>Convidar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}
