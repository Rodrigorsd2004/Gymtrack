import requests
import sys
import json
from datetime import datetime

class GymTrackAPITester:
    def __init__(self, base_url="https://gym-management-11.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'No error details')}"
                except:
                    details += f" - Response: {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_login(self):
        """Test admin login"""
        print("\n🔐 Testing Authentication...")
        
        response_data = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@gymtrack.com", "senha": "admin123"}
        )
        
        if response_data and 'token' in response_data:
            self.token = response_data['token']
            print(f"    Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_dashboard(self):
        """Test dashboard stats"""
        print("\n📊 Testing Dashboard...")
        
        stats = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if stats:
            print(f"    Stats: Alunos={stats.get('total_alunos', 0)}, Instrutores={stats.get('total_instrutores', 0)}")
            return stats
        return None

    def test_alunos_crud(self):
        """Test Alunos CRUD operations"""
        print("\n👥 Testing Alunos CRUD...")
        
        # Test GET alunos
        alunos = self.run_test("Get Alunos", "GET", "alunos", 200)
        
        # Test CREATE aluno
        aluno_data = {
            "nome": "João Silva Test",
            "idade": 25,
            "email": f"joao.test.{datetime.now().strftime('%H%M%S')}@test.com",
            "endereco": "Rua Test, 123"
        }
        
        created_aluno = self.run_test(
            "Create Aluno",
            "POST",
            "alunos",
            200,
            data=aluno_data
        )
        
        if created_aluno and 'id_aluno' in created_aluno:
            aluno_id = created_aluno['id_aluno']
            print(f"    Created aluno ID: {aluno_id}")
            
            # Test UPDATE aluno
            update_data = {"nome": "João Silva Updated", "idade": 26}
            self.run_test(
                "Update Aluno",
                "PUT",
                f"alunos/{aluno_id}",
                200,
                data=update_data
            )
            
            # Test age validation (should fail)
            invalid_data = {"idade": 5}
            self.run_test(
                "Aluno Age Validation (should fail)",
                "PUT",
                f"alunos/{aluno_id}",
                400,
                data=invalid_data
            )
            
            # Test DELETE aluno
            self.run_test(
                "Delete Aluno",
                "DELETE",
                f"alunos/{aluno_id}",
                200
            )
            
            return aluno_id
        return None

    def test_instrutores_crud(self):
        """Test Instrutores CRUD operations"""
        print("\n🏋️ Testing Instrutores CRUD...")
        
        # Test GET instrutores
        instrutores = self.run_test("Get Instrutores", "GET", "instrutores", 200)
        
        # Test CREATE instrutor
        instrutor_data = {
            "nome": "Maria Instrutor Test",
            "idade": 30,
            "email": f"maria.test.{datetime.now().strftime('%H%M%S')}@test.com",
            "telefone": "(11) 99999-9999"
        }
        
        created_instrutor = self.run_test(
            "Create Instrutor",
            "POST",
            "instrutores",
            200,
            data=instrutor_data
        )
        
        if created_instrutor and 'id_instrutor' in created_instrutor:
            instrutor_id = created_instrutor['id_instrutor']
            print(f"    Created instrutor ID: {instrutor_id}")
            
            # Test UPDATE instrutor
            update_data = {"nome": "Maria Instrutor Updated"}
            self.run_test(
                "Update Instrutor",
                "PUT",
                f"instrutores/{instrutor_id}",
                200,
                data=update_data
            )
            
            # Test age validation (should fail)
            invalid_data = {"idade": 16}
            self.run_test(
                "Instrutor Age Validation (should fail)",
                "PUT",
                f"instrutores/{instrutor_id}",
                400,
                data=invalid_data
            )
            
            return instrutor_id
        return None

    def test_agendas_crud(self, instrutor_id):
        """Test Agendas CRUD operations"""
        print("\n📅 Testing Agendas CRUD...")
        
        if not instrutor_id:
            print("    Skipping agendas test - no instrutor available")
            return None
        
        # Test GET agendas
        agendas = self.run_test("Get Agendas", "GET", "agendas", 200)
        
        # Test CREATE agenda
        agenda_data = {
            "data": "2024-12-31",
            "hora_inicio": "08:00",
            "hora_fim": "09:00",
            "disponivel": True,
            "instrutor_id_instrutor": instrutor_id
        }
        
        created_agenda = self.run_test(
            "Create Agenda",
            "POST",
            "agendas",
            200,
            data=agenda_data
        )
        
        if created_agenda and 'id_agenda' in created_agenda:
            agenda_id = created_agenda['id_agenda']
            print(f"    Created agenda ID: {agenda_id}")
            
            # Test time validation (should fail)
            invalid_data = {
                "data": "2024-12-31",
                "hora_inicio": "10:00",
                "hora_fim": "09:00",  # End time before start time
                "instrutor_id_instrutor": instrutor_id
            }
            self.run_test(
                "Agenda Time Validation (should fail)",
                "POST",
                "agendas",
                400,
                data=invalid_data
            )
            
            return agenda_id
        return None

    def test_treinos_crud(self, aluno_id, agenda_id):
        """Test Treinos CRUD operations"""
        print("\n💪 Testing Treinos CRUD...")
        
        # Test GET treinos
        treinos = self.run_test("Get Treinos", "GET", "treinos", 200)
        
        # Create a new aluno for treino testing
        aluno_data = {
            "nome": "Pedro Treino Test",
            "idade": 22,
            "email": f"pedro.treino.{datetime.now().strftime('%H%M%S')}@test.com"
        }
        
        created_aluno = self.run_test(
            "Create Aluno for Treino",
            "POST",
            "alunos",
            200,
            data=aluno_data
        )
        
        if created_aluno and 'id_aluno' in created_aluno:
            test_aluno_id = created_aluno['id_aluno']
            
            # Test CREATE treino simples
            treino_data = {
                "tipo_treino": "Simples",
                "nome_treino": "Treino Cardio Test",
                "aluno_id_aluno": test_aluno_id,
                "agenda_id_agenda": agenda_id
            }
            
            created_treino = self.run_test(
                "Create Treino Simples",
                "POST",
                "treinos",
                200,
                data=treino_data
            )
            
            # Test CREATE treino personalizado
            treino_personalizado = {
                "tipo_treino": "Personalizado",
                "nome_treino": "Treino Personalizado Test",
                "aluno_id_aluno": test_aluno_id,
                "descricao": "Treino focado em força",
                "nivel": "Intermediário",
                "duracao": "01:30"
            }
            
            created_treino_pers = self.run_test(
                "Create Treino Personalizado",
                "POST",
                "treinos",
                200,
                data=treino_personalizado
            )
            
            if created_treino and 'id_treino' in created_treino:
                treino_id = created_treino['id_treino']
                print(f"    Created treino ID: {treino_id}")
                
                # Test UPDATE treino
                update_data = {"nome_treino": "Treino Cardio Updated"}
                self.run_test(
                    "Update Treino",
                    "PUT",
                    f"treinos/{treino_id}",
                    200,
                    data=update_data
                )
                
                # Test DELETE treino
                self.run_test(
                    "Delete Treino",
                    "DELETE",
                    f"treinos/{treino_id}",
                    200
                )
            
            # Clean up test aluno
            self.run_test(
                "Delete Test Aluno",
                "DELETE",
                f"alunos/{test_aluno_id}",
                200
            )

    def cleanup_test_data(self, instrutor_id, agenda_id):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        if agenda_id:
            self.run_test(
                "Delete Test Agenda",
                "DELETE",
                f"agendas/{agenda_id}",
                200
            )
        
        if instrutor_id:
            self.run_test(
                "Delete Test Instrutor",
                "DELETE",
                f"instrutores/{instrutor_id}",
                200
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting GymTrack API Tests...")
        print(f"Base URL: {self.base_url}")
        
        # Test authentication
        if not self.test_login():
            print("❌ Login failed, stopping tests")
            return False
        
        # Test dashboard
        self.test_dashboard()
        
        # Test CRUD operations
        aluno_id = self.test_alunos_crud()
        instrutor_id = self.test_instrutores_crud()
        agenda_id = self.test_agendas_crud(instrutor_id)
        self.test_treinos_crud(aluno_id, agenda_id)
        
        # Cleanup
        self.cleanup_test_data(instrutor_id, agenda_id)
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = GymTrackAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'tests_run': tester.tests_run,
                'tests_passed': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0
            },
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())