import { HandPalm, Play } from 'phosphor-react'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';

import { NewCycleForm } from './components/NewCycleForm';
import { Countdown } from './components/Countdown';

import { HomeContainer, StartCountdownButton, StopCountdownButton } from './styles'

const newCycleFormValidationSchema = zod.object({
  task: zod.string().min(1, 'Informe a tarefa'),
  minutesAmount: zod
    .number()
    .min(1, 'O ciclo precisa ser de no mínimo 5 minutos.')
    .max(60, 'O ciclo precisa ser de no máximo 60 minutos.'),
});

type NewCycleFormData = zod.infer<typeof newCycleFormValidationSchema>;

interface Cycle {
  id: string;
  task: string;
  minutesAmount: number;
  startDate: Date;
  interruptedDate?: Date;
  finishedDate?: Date;
}

export function Home() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [amountSecoundsPassed, setAmountSecoundsPassed] = useState(0);

  const { register, handleSubmit, watch, reset } = useForm<NewCycleFormData>({
    resolver: zodResolver(newCycleFormValidationSchema),
    defaultValues: {
      task: '',
      minutesAmount: 0,
    }
  });

  const activeCycle = cycles.find(({ id }) => id === activeCycleId);

  const secondsInMinute = 60;
  const totalSeconds = activeCycle ? activeCycle.minutesAmount * secondsInMinute : 0;

  useEffect(() => {
    let interval: number;

    if (activeCycle) {
      interval = setInterval(() => {
        const secondsDifference = differenceInSeconds(
          new Date(),
          activeCycle.startDate,
        );

        if (secondsDifference >= totalSeconds) {
          setCycles(state => state.map(cycle => (
            cycle.id === activeCycleId
              ? { ...cycle, finishedDate: new Date() }
              : cycle
          )));

          setAmountSecoundsPassed(totalSeconds);
          setActiveCycleId(null);
          document.title = 'Ignite timer';
          clearInterval(interval);
        } else {
          setAmountSecoundsPassed(secondsDifference);
        }
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    }
  }, [activeCycle, activeCycleId, totalSeconds]);

  function handleCreateNewCycle(data: NewCycleFormData) {
    const startDate = new Date()
    const id = String(startDate.getTime());

    const newCycle: Cycle = {
      id,
      startDate,
      task: data.task,
      minutesAmount: data.minutesAmount,
    };

    setCycles((state) => ([...state, newCycle]));
    setActiveCycleId(id);
    setAmountSecoundsPassed(0);

    reset();
  }

  function handleInterruptCycle() {
    setCycles(state => state.map(cycle => (
      cycle.id === activeCycleId
        ? { ...cycle, interruptedDate: new Date() }
        : cycle
    )));
    setActiveCycleId(null);
    document.title = 'Ignite timer';
  }

  const currentSeconds = activeCycle ? totalSeconds - amountSecoundsPassed : 0;

  const minutesAmount = Math.floor(currentSeconds / secondsInMinute);
  const secondsAmount = currentSeconds % secondsInMinute;

  const minutes = minutesAmount.toString().padStart(2, '0');
  const seconds = secondsAmount.toString().padStart(2, '0');

  useEffect(() => {
    if (activeCycle) {
      document.title = `${minutes}:${seconds}`;
    }
  }, [activeCycle, minutes, seconds])

  const task = watch('task');
  const isSubmitDisabled = !task;

  return (
    <HomeContainer>
      <form onSubmit={handleSubmit(handleCreateNewCycle)}>
        <NewCycleForm />

        <Countdown
          minutes={minutes}
          seconds={seconds}
        />

        {activeCycle ? (
          <StopCountdownButton onClick={handleInterruptCycle} type="button">
            <HandPalm size={24} />
            Interromper
          </StopCountdownButton>
        ) : (
          <StartCountdownButton disabled={isSubmitDisabled} type="submit">
            <Play size={24} />
            Começar
          </StartCountdownButton>
        )}
      </form>
    </HomeContainer>
  );
}
